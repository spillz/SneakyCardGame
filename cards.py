from kivy.uix.widget import Widget
from kivy.uix.image import Image
from kivy.uix.boxlayout import BoxLayout
from kivy.properties import StringProperty, ReferenceListProperty, NumericProperty, \
    BooleanProperty, ObjectProperty, DictProperty, ListProperty
from kivy.uix.label import Label

from kivy.graphics import Rectangle, Color, Mesh, Line
from kivy.graphics.texture import Texture


import os
import math
from PIL import Image as PImage, ImageDraw, ImageFont
import random

def dist(pos1, pos2):
    dx = pos1[0]-pos2[0]
    dy = pos1[1]-pos2[1]
    return (dx*dx + dy*dy)**0.5


class Card(BoxLayout):
    name = StringProperty()
    card_text = StringProperty()
    selected = BooleanProperty(False)
    type = StringProperty()
    face_up = BooleanProperty(True)

    def __init__(self, **kwargs):
        if 'pa' in kwargs:
            kwargs['pa'].bind(size=self.card_resized)
            del kwargs['pa']
        super().__init__(**kwargs)

    def card_resized(self, playarea, sz):
        self.size = playarea.card_size

    def on_touch_down(self, touch):
        if self.collide_point(*self.to_local(*touch.pos)):
            print(self,self.pos,self.size)
        pass


class MapCard(Card):
    def __init__(self,**kwargs):
        self.w = 10
        self.h = 14
        if 'w' in kwargs:
            self.w = kwargs['w']
            del kwargs['w']
        if 'h' in kwargs:
            self.h = kwargs['h']
            del kwargs['h']
        super().__init__(**kwargs)

    def on_size(self, *args):
        self.draw_grid()

    def on_pos(self, *args):
        self.draw_grid()

    def card_resized(self, playarea, sz):
        self.size = playarea.map_card_size

    def draw_grid(self):
        self.canvas.clear()
        with self.canvas:
            size = self.width//self.w-1, self.height//self.h-1
            for i,j in self.map.iter_all():
                Color(*self.building_codes[self.map[(i,j)]][1])
                x = self.x + (i)*self.width//self.w
                y = self.y + (j)*self.height//self.h
                tile = self.map[(i,j)]
                if tile != 'B': #non-building tile
                    Rectangle(pos = (x,y), size = size)
                else: #Draw in roof line tile
                    s = size[0]+1, size[1]+1
                    Rectangle(pos = (x,y), size = s)
                    Color(0,0,0)
                    cx = x+s[0]//2
                    cy = y+s[1]//2
                    adj = [p for p in self.map.iter_types_in_range((i,j),'B',1)]
                    tl = tr = bl = br = 0
                    if (i+1,j) in adj:
                        Line(width = 1, points = (cx,cy,x+s[0],cy))
                        if (i,j+1) in adj:
                            tr+=1
                        if (i,j-1) in adj:
                            br+=1
                    else:
                        br+=1
                        tr+=1
                    if (i-1,j) in adj:
                        Line(width = 1, points = (cx,cy,x,cy))
                        if (i,j+1) in adj:
                            tl+=1
                        if (i,j-1) in adj:
                            bl+=1
                    else:
                        bl+=1
                        tl+=1
                    if (i,j+1) in adj:
                        Line(width = 1, points = (cx,cy,cx,y+s[1]))
                        if (i+1,j) in adj:
                            tr+=1
                        if (i-1,j) in adj:
                            tl+=1
                    else:
                        tl+=1
                        tr+=1
                    if (i,j-1) in adj:
                        Line(width = 1, points = (cx,cy,cx,y))
                        if (i+1,j) in adj:
                            br+=1
                        if (i-1,j) in adj:
                            bl+=1
                    else:
                        bl+=1
                        br+=1
                    if bl==2:
                        Line(width = 1, points = (cx,cy,x,y))
                    if br==2:
                        Line(width = 1, points = (cx,cy,x+s[0],y))
                    if tr==2:
                        Line(width = 1, points = (cx,cy,x+s[0],y+s[1]))
                    if tl==2:
                        Line(width = 1, points = (cx,cy,x,y+s[1]))

#        self.canvas.after.clear()
#        with self.canvas.after:
            for i,j in self.lights:
                Color(0.8,0.8,0.2,1)
                x = self.x + (i+0.4)*self.width//self.w
                y = self.y + (j+0.4)*self.height//self.h
                Rectangle(pos = (x,y), size = (size[0]//5,size[1]//5))
            for i,j in self.spawns:
                Color(0.9,0.0,0.0,1)
                x = self.x + (i+0.4)*self.width//self.w
                y = self.y + (j+0.4)*self.height//self.h
                Rectangle(pos = (x,y), size = (size[0]//5,size[1]//5))
            for i,j in self.waypoints:
                Color(0.6,0.0,0.0,1)
                x = self.x + (i+0.4)*self.width//self.w
                y = self.y + (j+0.4)*self.height//self.h
                Rectangle(pos = (x,y), size = (size[0]//5,size[1]//5))
            for i,j in self.targets:
                Color(0.1,0.3,0.8,1)
                x = self.x + (i+0.2)*self.width//self.w
                y = self.y + (j+0.2)*self.height//self.h
                w, h = 3*size[0]//5//2*2,3*size[1]//5//2*2
                #Rectangle(pos = (x,y), size = (3*size[0]//5,3*size[1]//5))
                vertices = [x+w//2,y,0,0,
                             x,y+2*h//3,0,0,
                             x+w//4,y+h,0,0,
                             x+3*w//4,y+h,0,0,
                             x+w,y+2*h//3,0,0,
                             ]
                indices = [0,4,3,2,1]
                Mesh(vertices = vertices,
                     indices = indices,
                     mode = 'triangle_fan'
                     )


class Map:
    def __init__(self, w, h):
        self.w = w
        self.h = h
        self._data = [['U' for a in range(w)] for b in range(h)]

    def __getitem__(self, pos):
        return self._data[pos[1]][pos[0]]

    def __setitem__(self, pos, val):
        self._data[pos[1]][pos[0]] = val

    def iter_between(self, pos1, pos2):
        x1,y1 = pos1
        x2,y2 = pos2
        if abs(y2-y1)==0 and abs(x2-x1)==0:
            return
        if abs(y2-y1)>abs(x2-x1):
            slope = (x2-x1)/(y2-y1)
            if y1>y2:
                y1,y2 = y2,y1
                x1,x2 = x2,x1
            for y in range(y1+1,y2):
                x = int(round(x1 + (y-y1)*slope))
                yield x,y
        else:
            slope = (y2-y1)/(x2-x1)
            if x1>x2:
                y1,y2 = y2,y1
                x1,x2 = x2,x1
            for x in range(x1+1,x2):
                y = int(round(y1 + (x-x1)*slope))
                yield x,y

    def iter_types_between(self, pos1, pos2, types):
        for pos in self.iter_between(pos1, pos2):
            if self[pos] in types:
                yield pos

    def has_types_between(self, pos1, pos2, types):
        for pos in self.iter_types_between(pos1, pos2, types):
            return True
        return False

    def iter_all(self,sub_rect=None):
        if sub_rect is not None:
            for x in range(sub_rect[0],min(self.w,sub_rect[0]+sub_rect[2])):
                for y in range(sub_rect[1],min(self.h,sub_rect[1]+sub_rect[3])):
                    yield x,y
        else:
            for x in range(self.w):
                for y in range(self.h):
                    yield x,y

    def iter_types(self, types, sub_rect=None):
        for x0,y0 in self.iter_all(sub_rect):
            if self[(x0,y0)] in types:
                yield x0,y0

    def iter_in_range(self, pos, radius=3):
        x,y = pos
        rad = math.ceil(radius)
        for xoff in range(-rad,rad+1):
            for yoff in range(-rad,rad+1):
                if xoff*xoff+yoff*yoff<=radius*radius:
                    x0 = x+xoff
                    y0 = y+yoff
                    if 0<=y0<self.h and 0<=x0<self.w:
                        yield x0,y0

    def iter_types_in_range(self, pos, types, radius=3, blocker_types=None):
        for pos0 in self.iter_in_range(pos, radius):
            if blocker_types is not None and self.has_types_between(pos, pos0, blocker_types):
                continue
            if self[pos0] in types:
                yield pos0

    def num_in_range(self, pos, types, radius=3, blocker_types=None):
        num = 0
        for pos0 in self.iter_types_in_range(pos, types, radius, blocker_types):
            num+=1
        return num

    def iter_rect(self, pos, size, must_fit=True):
        x,y=pos
        w,h=size
        if must_fit and (x<0 or y<0 or x+w>self.w or y+h>self.h):
            return

        xl = max(x,0)
        xu = min(x+w,self.w)

        yl = max(y,0)
        yu = min(y+h,self.h)

        for x0 in range(xl,xu):
            for y0 in range(yl,yu):
                yield x0,y0

    def num_in_rect(self, pos, size, targets, must_fit=True):
        for pos in self.iter_rect(pos, size, must_fit):
            if self[pos] in targets:
                yield pos


class CityMap(MapCard):
    building_codes= {'B': ('Building rooftop', [0.35,0.15,0.15,1]),
                     'U': ('Unlit Pavement', [0.1,0.1,0.1,1]),
                     'L': ('Lit Pavement',[0.3,0.3,0.35,1]),
                     'G': ('Guard',[0.4,0.4,0.8,1]),
                     'S': ('Guard search and spawn point',[0.9,0.6,0.6,1]),
                     'Z': ('Loot Zone',[0.6,0.6,0.6,1]),
                     'M': ('Market', [0.6,0.9,0.6,1])}
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.make_map()

    def make_map(self):
        self.map = Map(w=self.w,h=self.h)

        density = random.uniform(0.3, 0.7)
        filled_area = 0
        filled_borders = [0,0,0,0] #left, bottom, right, top
        i=0
        while filled_area < density*self.w*self.h and i<100:
            orient = random.randint(0,1)
            if orient==0: #horizontal
                size = random.randrange(2,self.w-filled_borders[0]-filled_borders[1]),1
            else: #vertical
                size = 1,random.randrange(2,self.h-filled_borders[2]-filled_borders[3])
            x = random.randrange(filled_borders[0],self.w-size[0])
            y = random.randrange(filled_borders[2],self.h-size[1])
            filled_area += self.place_building((x,y),size,filled_borders)
            i+=1

        self.add_lights()
        self.add_spawns()
        self.add_waypoints()
        self.add_targets()

    def clamp(self, pos):
        return max(min(pos[0],self.w-1),0),max(min(pos[1],self.h-1),0)

    def is_adj(self,pos):
        x0,y0 = pos
        for x,y in [(x0-1,y0-1), (x0+1,y0-1), (x0-1,y0+1), (x0+1,y0+1)]:
            if x<0 or x>=self.w or y<0 or y>=self.h:
                continue
            if self.map[(x,y)]!='U':
                return True
        return False

    def place_building(self, pos, size, filled_borders, shape='R', orientation=0):
        print('Placing',pos,size,shape)
        if shape=='R':
            for x in range(pos[0],pos[0]+size[0]):
                for y in range(pos[1],pos[1]+size[1]):
                    if self.map.num_in_range(pos=(x,y), types='B',radius=1.5)>1: # self.map[(x,y)] != 'U' or self.is_adj((x,y)):
                        return 0
            for r in range(pos[1],pos[1]+size[1]):
                if r==0:
                    filled_borders[2]=1
                if r==self.h-1:
                    filled_borders[3]=1
                for c in range(pos[0],pos[0]+size[0]):
                    if c==0:
                        filled_borders[0]=1
                    if c==self.w-1:
                        filled_borders[1]=1
                    self.map[(c,r)] = 'B'
            return size[0]*size[1]


    def get_best_lightables(self):
        bestn = 0
        bestp = []
        for p in self.map.iter_types('U',sub_rect=[1,1,self.map.w-1,self.map.h-1]):
            n = self.map.num_in_range(p, 'U', radius=2, blocker_types='B')
            if n>bestn:
                bestp = [p]
                bestn = n
            elif n==bestn:
                bestp.append(p)
        return bestp

    def add_lights(self):
        self.lights = []
        num_lights = random.randint(1,3)
        for i in range(num_lights):
            best_lightables = self.get_best_lightables()
            if len(best_lightables) == 0:
                break
            self.lights.append(random.choice(best_lightables))
            for pos in self.map.iter_types_in_range(self.lights[-1], 'U', blocker_types='B', radius=2):
                self.map[pos] = 'L'

    def add_spawns(self):
        '''add the waypoints where guards spwan'''
        self.spawns=[]
        num_spawns = random.randint(2,4)
        for s in range(num_spawns):
            new_spawn = None
            options = [p for p in self.map.iter_types('UL', sub_rect=[1,1,self.map.w-1,self.map.h-1])] #,sub_rect=[1,1,self.map.w-1,self.map.h-1]
            random.shuffle(options)
            for pos in options:
                if len(self.spawns)==0 or min([dist(pos,s) for s in self.spawns])>5:
                    new_spawn = pos
                    break
            if new_spawn is not None:
                self.spawns.append(new_spawn)
            else:
                break

    def add_waypoints(self):
        '''add the waypoints where guards traverse'''
        self.waypoints=[]
        num_waypoints = 8-len(self.spawns)
        for s in range(num_waypoints):
            new_wp = None
            options = [p for p in self.map.iter_types('UL', sub_rect=[1,1,self.map.w-1,self.map.h-1])]
            random.shuffle(options)
            for pos in options:
                if len(self.waypoints)+len(self.spawns)==0 or min([dist(pos,s) for s in self.waypoints+self.spawns])>3:
                    new_wp = pos
                    break
            if new_wp is not None:
                self.waypoints.append(new_wp)
            else:
                break

    def add_targets(self):
        '''loot targets, but at a risk -- hmmm, how to convey the risk...'''
        '''selects the waypoints where guards spwan'''
        self.targets=[]
        num_targets = random.randint(1,2)
        for s in range(num_targets):
            new_target = None
            options = [p for p in self.map.iter_types('B', sub_rect=[1,1,self.map.w-1,self.map.h-1])]
            random.shuffle(options)
            for pos in options:
                if len(self.targets)==0 or min([dist(pos,s) for s in self.targets])>5:
                    new_target = pos
                    break
            if new_target is not None:
                self.targets.append(new_target)
            else:
                break


class EventCard(Card):
    def activate(self, board):
        self.board = board
        guard = self.board.nearest_guard(self.board.active_player_token.map_pos)
        if guard is None:
            print('No guard found')
            return True
        print('Nearest guard', guard.map_pos)
        new_pos = self.board.guard_nearest_move(guard.map_pos, self.board.active_player_token.map_pos)
        if new_pos == self.board.active_player_token.map_pos:
            if self.board[new_pos] == 'U':
                print('Guard wants to move to player at unlit space', new_pos)
                return
        print('Moving guard to', new_pos)
        guard.map_pos = new_pos


class SpawnEvent(EventCard):
    pass


class PatrolEvent(EventCard):
    pass


class AlertEvent(EventCard):
    pass


class MoveEvent(EventCard):
    def activate(self, board):
        self.board = board
        guard = self.board.nearest_guard(self.board.active_player_token.map_pos)
        if guard is None:
            print('No guard found')
            return True
        print('Nearest guard', guard.map_pos)
        new_pos = self.board.guard_nearest_move(guard.map_pos, self.board.active_player_token.map_pos)
        if new_pos == self.board.active_player_token.map_pos:
            if self.board[new_pos] == 'U':
                print('Guard wants to move to player at unlit space', new_pos)
                return
        print('Moving guard to', new_pos)
        guard.map_pos = new_pos


class PlayerCard(Card):
    def activate(self, board):
        self.board = board
        board.map_choices = [board.make_choice(p,self.move_completed) for p in board.walkable_spots(board.active_player_token.map_pos, dist=1, spots={})]

    def move_completed(self, touch_object):
        self.board.active_player_token.map_pos = touch_object.map_pos
        self.board.map_choices = []


class StartPlayerCard(PlayerCard):
    pass


class LootCard(PlayerCard):
    pass


class TreasureCard(LootCard):
    pass


class MarketCard(PlayerCard):
    pass


class PoisonArrow(MarketCard):
    pass


class RopeArrow(MarketCard):
    pass


class WhistlerArrow(MarketCard):
    pass


class SmokeBomb(MarketCard):
    pass


class Lure(MarketCard):
    pass


class BasicMove(StartPlayerCard):
    def activate(self, board):
        self.board = board
        board.map_choices = [board.make_choice(p,self.move_completed) for p in board.walkable_spots(board.active_player_token.map_pos, dist=2, spots={})]
        print([c.map_pos for c in board.map_choices])

    def move_completed(self, touch_object):
        self.board.active_player_token.map_pos = touch_object.map_pos
        self.board.map_choices = []

class BasicAttack(StartPlayerCard):
    pass


class BasicClimb(StartPlayerCard):
    pass


class BasicSneak(StartPlayerCard):
    pass


class BasicKockout(StartPlayerCard):
    pass


class BasicArrow(StartPlayerCard):
    pass


class BasicBow(StartPlayerCard):
    pass


class BasicSword(StartPlayerCard):
    pass


def make_map_cards(pa, w, h):
    return [m(pa=pa, w=w, h=h) for m in MapCard.__subclasses__() for i in range(12)]

def make_event_cards(pa):
    return [m(pa=pa) for m in EventCard.__subclasses__() for i in range(3)]

def make_loot_cards(pa):
    return [[h(pa=pa) for h in LootCard.__subclasses__() for j in range(10)] for i in range(3)]

def make_market_cards(pa):
    return [h(pa=pa) for h in MarketCard.__subclasses__() for i in range (20)]

def make_player_cards(pa):
    return [m(pa=pa) for m in StartPlayerCard.__subclasses__() for i in range(2)]
