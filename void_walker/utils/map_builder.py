"""
Void Walker - Map Builder.

Constructs a 2D grid-based map from scenario location connections.
Implements fog of war: only visited, adjacent, and discovered locations are visible.
"""

from collections import deque
from dataclasses import dataclass, field
from enum import Enum
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from rich.text import Text
    from void_walker.core.state import GameState, Location, Scenario


class RoomVisibility(Enum):
    """Visibility state for map rooms."""
    HIDDEN = "hidden"          # Not visible at all (fog or is_hidden)
    FOG = "fog"                # Beyond adjacent - show as "?"
    ADJACENT = "adjacent"      # Adjacent to visited - show name but not visited
    VISITED = "visited"        # Previously visited
    CURRENT = "current"        # Player is here


@dataclass
class MapRoom:
    """A room positioned on the map grid."""
    location_id: str
    name: str
    x: int
    y: int
    visibility: RoomVisibility
    has_threat: bool = False
    connections: dict[str, str] = field(default_factory=dict)  # direction -> location_id


@dataclass
class MapGrid:
    """2D grid representation of the map."""
    rooms: dict[str, MapRoom]  # location_id -> MapRoom
    width: int
    height: int
    min_x: int = 0
    min_y: int = 0
    
    def get_room_at(self, x: int, y: int) -> MapRoom | None:
        """Get room at grid position."""
        for room in self.rooms.values():
            if room.x == x and room.y == y:
                return room
        return None
    
    def get_connection_direction(self, from_id: str, to_id: str) -> str | None:
        """Get the direction from one room to another."""
        if from_id not in self.rooms or to_id not in self.rooms:
            return None
        from_room = self.rooms[from_id]
        to_room = self.rooms[to_id]
        
        dx = to_room.x - from_room.x
        dy = to_room.y - from_room.y
        
        # Determine primary direction
        if abs(dx) >= abs(dy):
            return "east" if dx > 0 else "west"
        else:
            return "south" if dy > 0 else "north"


# Direction offsets for BFS expansion (prioritize right, then down, then up, then left)
DIRECTION_OFFSETS = [
    ("east", 1, 0),
    ("south", 0, 1),
    ("north", 0, -1),
    ("west", -1, 0),
]

OPPOSITE_DIRECTION = {
    "north": "south",
    "south": "north",
    "east": "west",
    "west": "east",
}


def build_map_grid(
    state: "GameState",
    max_width: int = 40,
    max_height: int = 15,
) -> MapGrid:
    """
    Build a 2D grid map from scenario locations using BFS layout.
    
    Args:
        state: Current game state with scenario and visibility info
        max_width: Maximum grid width in cells
        max_height: Maximum grid height in cells
    
    Returns:
        MapGrid with positioned rooms and visibility states
    """
    scenario = state.scenario
    visited = state.visited_locations
    discovered = getattr(state, 'discovered_locations', set())
    current = state.current_location
    
    # Build location lookup
    locations = {loc.id: loc for loc in scenario.locations}
    
    # Filter out hidden locations that haven't been discovered
    visible_location_ids = {
        loc.id for loc in scenario.locations
        if not loc.is_hidden or loc.id in discovered or loc.id in visited
    }
    
    # BFS to assign positions, starting from starting_location
    start_id = scenario.starting_location
    if start_id not in locations:
        # Fallback to first location
        start_id = scenario.locations[0].id if scenario.locations else None
    
    if not start_id:
        return MapGrid(rooms={}, width=0, height=0)
    
    # Position tracking
    positions: dict[str, tuple[int, int]] = {}
    occupied: set[tuple[int, int]] = set()
    
    # BFS queue: (location_id, x, y)
    queue = deque([(start_id, 0, 0)])
    positions[start_id] = (0, 0)
    occupied.add((0, 0))
    
    while queue:
        loc_id, x, y = queue.popleft()
        
        if loc_id not in locations:
            continue
            
        loc = locations[loc_id]
        
        # Try to place each connected location
        for conn_id in loc.connections:
            if conn_id in positions:
                continue  # Already placed
            if conn_id not in visible_location_ids:
                continue  # Hidden and not discovered
            
            # Find an available adjacent cell
            placed = False
            for direction, dx, dy in DIRECTION_OFFSETS:
                new_x, new_y = x + dx, y + dy
                
                # Check bounds
                if abs(new_x) > max_width // 2 or abs(new_y) > max_height // 2:
                    continue
                
                if (new_x, new_y) not in occupied:
                    positions[conn_id] = (new_x, new_y)
                    occupied.add((new_x, new_y))
                    queue.append((conn_id, new_x, new_y))
                    placed = True
                    break
            
            # If no adjacent cell available, try a spiral search
            if not placed:
                for radius in range(1, max(max_width, max_height)):
                    found = False
                    for dx in range(-radius, radius + 1):
                        for dy in range(-radius, radius + 1):
                            if abs(dx) != radius and abs(dy) != radius:
                                continue  # Only check perimeter
                            new_x, new_y = x + dx, y + dy
                            if abs(new_x) > max_width // 2 or abs(new_y) > max_height // 2:
                                continue
                            if (new_x, new_y) not in occupied:
                                positions[conn_id] = (new_x, new_y)
                                occupied.add((new_x, new_y))
                                queue.append((conn_id, new_x, new_y))
                                found = True
                                break
                        if found:
                            break
                    if found:
                        break
    
    # Calculate visibility for each room
    rooms: dict[str, MapRoom] = {}
    
    # Get all adjacent location IDs (connected to any visited location)
    adjacent_ids: set[str] = set()
    for v_id in visited:
        if v_id in locations:
            for conn_id in locations[v_id].connections:
                if conn_id not in visited:
                    adjacent_ids.add(conn_id)
    
    # Also add adjacent to current location
    if current in locations:
        for conn_id in locations[current].connections:
            if conn_id not in visited:
                adjacent_ids.add(conn_id)
    
    for loc_id, (x, y) in positions.items():
        loc = locations[loc_id]
        
        # Determine visibility
        if loc.is_hidden and loc_id not in discovered and loc_id not in visited:
            visibility = RoomVisibility.HIDDEN
        elif loc_id == current:
            visibility = RoomVisibility.CURRENT
        elif loc_id in visited:
            visibility = RoomVisibility.VISITED
        elif loc_id in adjacent_ids:
            visibility = RoomVisibility.ADJACENT
        else:
            visibility = RoomVisibility.FOG
        
        # Build connection directions
        conn_dirs: dict[str, str] = {}
        for conn_id in loc.connections:
            if conn_id in positions:
                conn_x, conn_y = positions[conn_id]
                dx, dy = conn_x - x, conn_y - y
                if abs(dx) >= abs(dy):
                    direction = "east" if dx > 0 else "west"
                else:
                    direction = "south" if dy > 0 else "north"
                conn_dirs[direction] = conn_id
        
        rooms[loc_id] = MapRoom(
            location_id=loc_id,
            name=loc.name,
            x=x,
            y=y,
            visibility=visibility,
            has_threat=bool(loc.threats),
            connections=conn_dirs,
        )
    
    # Calculate grid bounds
    if not positions:
        return MapGrid(rooms={}, width=0, height=0)
    
    xs = [p[0] for p in positions.values()]
    ys = [p[1] for p in positions.values()]
    min_x, max_x = min(xs), max(xs)
    min_y, max_y = min(ys), max(ys)
    
    return MapGrid(
        rooms=rooms,
        width=max_x - min_x + 1,
        height=max_y - min_y + 1,
        min_x=min_x,
        min_y=min_y,
    )


def render_map_ascii(grid: MapGrid, cell_width: int = 14, cell_height: int = 3) -> list[str]:
    """
    Render the map grid as ASCII art.
    
    Args:
        grid: The MapGrid to render
        cell_width: Width of each room cell in characters
        cell_height: Height of each room cell in lines
    
    Returns:
        List of strings representing the map lines
    """
    if not grid.rooms:
        return ["(Carte vide)"]
    
    # Create empty grid
    total_width = grid.width * cell_width + (grid.width - 1) * 3  # 3 chars for connections
    total_height = grid.height * cell_height + (grid.height - 1)  # 1 line for vertical connections
    
    # Initialize with spaces
    lines: list[list[str]] = [[" " for _ in range(total_width)] for _ in range(total_height)]
    
    def get_cell_position(x: int, y: int) -> tuple[int, int]:
        """Convert grid coordinates to character position."""
        char_x = (x - grid.min_x) * (cell_width + 3)
        char_y = (y - grid.min_y) * (cell_height + 1)
        return char_x, char_y
    
    def truncate_name(name: str, max_len: int) -> str:
        """Truncate name to fit in cell."""
        if len(name) <= max_len:
            return name
        return name[:max_len - 2] + ".."
    
    # Draw rooms
    for room in grid.rooms.values():
        if room.visibility == RoomVisibility.HIDDEN:
            continue
            
        char_x, char_y = get_cell_position(room.x, room.y)
        
        # Room symbol and name based on visibility
        if room.visibility == RoomVisibility.CURRENT:
            symbol = "█"
            display_name = truncate_name(room.name, cell_width - 4)
            name_style = "current"
        elif room.visibility == RoomVisibility.VISITED:
            symbol = "░"
            display_name = truncate_name(room.name, cell_width - 4)
            name_style = "visited"
        elif room.visibility == RoomVisibility.ADJACENT:
            symbol = "○"
            display_name = truncate_name(room.name, cell_width - 4)
            name_style = "adjacent"
        else:  # FOG
            symbol = "?"
            display_name = "???"
            name_style = "fog"
        
        # Draw room box (simplified - just the name line)
        # Center the content in the cell
        content = f"{symbol} {display_name}"
        if room.has_threat and room.visibility in (RoomVisibility.CURRENT, RoomVisibility.VISITED):
            content += " ⚠"
        
        # Place content centered vertically
        mid_y = char_y + cell_height // 2
        for i, c in enumerate(content[:cell_width]):
            if char_x + i < total_width and mid_y < total_height:
                lines[mid_y][char_x + i] = c
    
    # Draw connections
    for room in grid.rooms.values():
        if room.visibility == RoomVisibility.HIDDEN:
            continue
            
        char_x, char_y = get_cell_position(room.x, room.y)
        mid_y = char_y + cell_height // 2
        
        for direction, conn_id in room.connections.items():
            if conn_id not in grid.rooms:
                continue
            conn_room = grid.rooms[conn_id]
            if conn_room.visibility == RoomVisibility.HIDDEN:
                continue
            
            # Only draw connection if both rooms are visible
            if direction == "east":
                # Draw horizontal connection to the right
                start_x = char_x + cell_width
                for i in range(3):
                    if start_x + i < total_width:
                        lines[mid_y][start_x + i] = "─"
            elif direction == "south":
                # Draw vertical connection down
                start_y = char_y + cell_height
                if start_y < total_height:
                    # Center the vertical line
                    center_x = char_x + cell_width // 2
                    if center_x < total_width:
                        lines[start_y][center_x] = "│"
    
    # Convert to strings
    return ["".join(line).rstrip() for line in lines]


def render_map_rich(grid: MapGrid, cell_width: int = 22) -> "Text":
    """
    Render the map grid using Rich Text with bordered cells and 2-line room names.
    
    Args:
        grid: The MapGrid to render
        cell_width: Width of each room cell in characters (interior width)
    
    Returns:
        Rich Text object with styled map
    """
    from rich.text import Text
    
    if not grid.rooms:
        return Text("(Carte vide)", style="dim")
    
    content = Text()
    
    # Collect visible rooms
    visible_rooms = [r for r in grid.rooms.values() if r.visibility != RoomVisibility.HIDDEN]
    if not visible_rooms:
        return Text("(Carte vide)", style="dim")
    
    # Get grid bounds
    all_xs = [r.x for r in visible_rooms]
    all_ys = [r.y for r in visible_rooms]
    min_x, max_x = min(all_xs), max(all_xs)
    min_y, max_y = min(all_ys), max(all_ys)
    
    def get_room_at_pos(x: int, y: int) -> MapRoom | None:
        for room in visible_rooms:
            if room.x == x and room.y == y:
                return room
        return None
    
    def wrap_name(name: str, max_len: int) -> tuple[str, str]:
        """Wrap name into 2 lines."""
        if len(name) <= max_len:
            return name, ""
        
        # Try to break at a space
        break_point = name.rfind(" ", 0, max_len)
        if break_point > max_len // 2:
            line1 = name[:break_point]
            line2 = name[break_point + 1:]
        else:
            # No good space, just split
            line1 = name[:max_len]
            line2 = name[max_len:]
        
        # Truncate line2 if needed
        if len(line2) > max_len:
            line2 = line2[:max_len - 1] + "…"
        
        return line1, line2
    
    def has_connection(room: MapRoom | None, direction: str) -> bool:
        if not room:
            return False
        return direction in room.connections
    
    # Box drawing characters
    H_LINE = "─"
    V_LINE = "│"
    TL_CORNER = "┌"
    TR_CORNER = "┐"
    BL_CORNER = "└"
    BR_CORNER = "┘"
    
    connector_gap = 3  # Space between cells for connectors
    
    # For each row of rooms
    for y in range(min_y, max_y + 1):
        # === TOP BORDER LINE ===
        for x in range(min_x, max_x + 1):
            room = get_room_at_pos(x, y)
            if room:
                content.append(TL_CORNER, style="dim")
                content.append(H_LINE * cell_width, style="dim")
                content.append(TR_CORNER, style="dim")
            else:
                content.append(" " * (cell_width + 2))
            
            if x < max_x:
                content.append(" " * connector_gap)
        content.append("\n")
        
        # === ROOM NAME LINE 1 (with symbol) ===
        for x in range(min_x, max_x + 1):
            room = get_room_at_pos(x, y)
            if room:
                content.append(V_LINE, style="dim")
                
                # Room content with symbol
                if room.visibility == RoomVisibility.CURRENT:
                    symbol = "█"
                    symbol_style = "success"
                    name_style = "text.bright"
                elif room.visibility == RoomVisibility.VISITED:
                    symbol = "░"
                    symbol_style = "dim"
                    name_style = "text"
                elif room.visibility == RoomVisibility.ADJACENT:
                    symbol = "○"
                    symbol_style = "info"
                    name_style = "text"
                else:  # FOG
                    symbol = "?"
                    symbol_style = "dim"
                    name_style = "dim"
                
                content.append(symbol, style=symbol_style)
                content.append(" ")
                
                # Room name or ???
                if room.visibility == RoomVisibility.FOG:
                    line1, line2 = "???", ""
                else:
                    # Leave space for symbol (2) and potential threat (2)
                    line1, line2 = wrap_name(room.name, cell_width - 4)
                
                content.append(line1, style=name_style)
                
                # Threat indicator on line 1
                threat_str = ""
                if room.has_threat and room.visibility in (RoomVisibility.CURRENT, RoomVisibility.VISITED):
                    threat_str = " ⚠"
                    content.append(threat_str, style="danger")
                
                # Padding for line 1
                used = 2 + len(line1) + len(threat_str)
                padding = cell_width - used
                if padding > 0:
                    content.append(" " * padding)
                
                content.append(V_LINE, style="dim")
                
                # Store line2 for next row rendering
                room._line2 = line2  # type: ignore
                room._name_style = name_style  # type: ignore
            else:
                content.append(" " * (cell_width + 2))
            
            # Horizontal connector between rooms (on line 1)
            if x < max_x:
                content.append("   ")
        content.append("\n")
        
        # === ROOM NAME LINE 2 (continuation) ===
        for x in range(min_x, max_x + 1):
            room = get_room_at_pos(x, y)
            if room:
                content.append(V_LINE, style="dim")
                
                line2 = getattr(room, '_line2', '')
                name_style = getattr(room, '_name_style', 'text')
                
                content.append("  ")  # Indent to align with line 1
                content.append(line2, style=name_style)
                
                # Padding for line 2
                used = 2 + len(line2)
                padding = cell_width - used
                if padding > 0:
                    content.append(" " * padding)
                
                content.append(V_LINE, style="dim")
            else:
                content.append(" " * (cell_width + 2))
            
            # Horizontal connector between rooms (centered)
            if x < max_x:
                room_here = get_room_at_pos(x, y)
                if room_here and has_connection(room_here, "east"):
                    content.append("───", style="dim")
                else:
                    content.append("   ")
        content.append("\n")
        
        # === BOTTOM BORDER LINE ===
        for x in range(min_x, max_x + 1):
            room = get_room_at_pos(x, y)
            if room:
                content.append(BL_CORNER, style="dim")
                content.append(H_LINE * cell_width, style="dim")
                content.append(BR_CORNER, style="dim")
            else:
                content.append(" " * (cell_width + 2))
            
            if x < max_x:
                content.append(" " * connector_gap)
        content.append("\n")
        
        # === VERTICAL CONNECTOR LINE (between rows) ===
        if y < max_y:
            for x in range(min_x, max_x + 1):
                room = get_room_at_pos(x, y)
                if room and has_connection(room, "south"):
                    # Center the vertical connector
                    left_pad = (cell_width + 2) // 2
                    right_pad = (cell_width + 2) - left_pad - 1
                    content.append(" " * left_pad)
                    content.append("│", style="dim")
                    content.append(" " * right_pad)
                else:
                    content.append(" " * (cell_width + 2))
                
                if x < max_x:
                    content.append(" " * connector_gap)
            content.append("\n")
    
    # Legend
    content.append("\n")
    content.append("█", style="success")
    content.append(" Vous   ")
    content.append("░", style="dim")
    content.append(" Visité   ")
    content.append("○", style="info")
    content.append(" Adjacent   ")
    content.append("?", style="dim")
    content.append(" Inconnu   ")
    content.append("⚠", style="danger")
    content.append(" Danger")
    
    return content

