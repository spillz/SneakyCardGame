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
#from PIL import Image as PImage, ImageDraw, ImageFont
import random
import time

def dist(pos1, pos2):
    dx = abs(pos1[0]-pos2[0])
    dy = abs(pos1[1]-pos2[1])
    return max(dx,dy)+0.5*min(dx,dy)


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
            pass
        pass


class MapCard(Card):
    building_types = ['B','B0']
    card_level = 1 #Difficulty level of the card 1-5

    def __init__(self,**kwargs):
        self.w = 10
        self.h = 14
        if 'card_level' in kwargs:
            self.card_level = kwargs['card_level']
            del kwargs['card_level']
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
                if tile not in self.building_types: #non-building tile
                    Rectangle(pos = (x,y), size = size)
                else: #Draw in roof line tile
                    s = size[0]+1, size[1]+1
                    Rectangle(pos = (x,y), size = s)
                    Color(0,0,0)
                    cx = x+s[0]//2
                    cy = y+s[1]//2
                    adj = [p for p in self.map.iter_types_in_range((i,j),self.building_types,1)]
                    tl = tr = bl = br = 0
                    if (i+1,j) in adj:
                        Line(width = 0.5, points = (cx,cy,x+s[0],cy))
                        if (i,j+1) in adj:
                            tr+=1
                        if (i,j-1) in adj:
                            br+=1
                    else:
                        br+=1
                        tr+=1
                    if (i-1,j) in adj:
                        Line(width = 0.5, points = (cx,cy,x,cy))
                        if (i,j+1) in adj:
                            tl+=1
                        if (i,j-1) in adj:
                            bl+=1
                    else:
                        bl+=1
                        tl+=1
                    if (i,j+1) in adj:
                        Line(width = 0.5, points = (cx,cy,cx,y+s[1]))
                        if (i+1,j) in adj:
                            tr+=1
                        if (i-1,j) in adj:
                            tl+=1
                    else:
                        tl+=1
                        tr+=1
                    if (i,j-1) in adj:
                        Line(width = 0.5, points = (cx,cy,cx,y))
                        if (i+1,j) in adj:
                            br+=1
                        if (i-1,j) in adj:
                            bl+=1
                    else:
                        bl+=1
                        br+=1
                    if bl==2:
                        Line(width = 0.5, points = (cx,cy,x,y))
                    if br==2:
                        Line(width = 0.5, points = (cx,cy,x+s[0],y))
                    if tr==2:
                        Line(width = 0.5, points = (cx,cy,x+s[0],y+s[1]))
                    if tl==2:
                        Line(width = 0.5, points = (cx,cy,x,y+s[1]))

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


unlit = [0.1,0.1,0.1,1]
lit = [0.3,0.3,0.35,1]
def light(lit, unlit, wt):
    return [l*wt + u*(1-wt) for l,u in zip(lit[:3],unlit[:3])]+[1]


class CityMap(MapCard):
    building_codes= {'B': ('Building rooftop', [0.35,0.15,0.15,1]),
                     'U': ('Unlit Pavement', unlit),
                     'L0': ('Lit Pavement', lit),
                     'L1': ('Lit Pavement', light(lit,unlit,0.66)),
                     'L2': ('Lit Pavement', light(lit,unlit,0.33)),
                     'L3': ('Lit Pavement', light(lit,unlit,0.15)),
                     'G': ('Guard',[0.4,0.4,0.8,1]),
                     'S': ('Guard search and spawn point',[0.9,0.6,0.6,1]),
                     'Z': ('Loot Zone',[0.6,0.6,0.6,1]),
                     'M': ('Market', [0.6,0.9,0.6,1])}
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.pavement = 'U,L0,L1,L2'.split(',')
        self.make_map()

    def make_map(self):
        self.map = Map(w=self.w,h=self.h)

        density = random.uniform(0.2, 0.55) + 0.05*self.card_level
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
        self.add_markets()

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
        num_lights = random.randint(1,self.card_level)
        for i in range(num_lights):
            best_lightables = self.get_best_lightables()
            if len(best_lightables) == 0:
                break
            self.lights.append(random.choice(best_lightables))
            self.light_map(self.lights[-1:], reset=False)

    def light_map(self, lights, reset=True):
        if reset:
            for p in self.map.iter_all():
                if self.map[p].startswith('L'):
                    self.map[p] = 'U'
        for l in lights:
            for pos in self.map.iter_types_in_range(l, 'U', blocker_types='B', radius=2):
                d = dist(pos, l)
                self.map[pos] = f'L{d:1.0f}'

    def add_spawns(self):
        '''add the waypoints where guards spwan'''
        self.spawns=[]
        num_spawns = random.randint(self.card_level,self.card_level+1)
        for s in range(num_spawns):
            new_spawn = None
            options = [p for p in self.map.iter_types(self.pavement, sub_rect=[1,1,self.map.w-1,self.map.h-1])] #,sub_rect=[1,1,self.map.w-1,self.map.h-1]
            random.shuffle(options)
            for pos in options:
                if len(self.spawns)==0 or min([dist(pos,s) for s in self.spawns])>6-self.card_level:
                    new_spawn = pos
                    break
            if new_spawn is not None:
                self.spawns.append(new_spawn)
            else:
                break

    def add_waypoints(self):
        '''add the waypoints where guards traverse'''
        self.waypoints=[]
        num_waypoints = 4 + self.card_level - len(self.spawns) - random.randint(0,1)
        for s in range(num_waypoints):
            new_wp = None
            options = [p for p in self.map.iter_types(self.pavement, sub_rect=[1,1,self.map.w-1,self.map.h-1])]
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

    def add_markets(self):
        '''markets let you buy cards from a river. Spend treasure cards to access them'''
        self.markets=[]
        num_markets = random.choice([0,0,1])
        for s in range(num_markets):
            new_market = None
            options = [p for p in self.map.iter_types('B', sub_rect=[1,1,self.map.w-1,self.map.h-1])]
            random.shuffle(options)
            for pos in options:
                if len(self.markets)==0 or min([dist(pos,s) for s in self.markets])>5:
                    new_market = pos
                    break
            if new_market is not None:
                self.markets.append(new_market)
            else:
                break


class EventCard(Card):
    def activate(self, board):
        pass


class SpawnEvent(EventCard):
    #TODO: Do we want to spawn globally or just the card (as implemented). Should prioritize empty cells if a tie.
    def activate(self, board):
        self.board = board
        card, pos = board.get_card_and_pos(self.board.active_player_token.map_pos)
        mind=1000
        bests=None
        for s in card.spawns+card.waypoints:
            d = dist(pos, s)
            if d<mind:
                mind = d
                bests = s
        if bests is not None:
            np = board.get_pos_from_card(card, bests)
#            g = board.token_types['G'](map_pos = np)
            g = board.token_types['G']()
            board.tokens.append(g)
            g.map_pos = np


class PatrolEvent(EventCard):
    def activate(self, board):
        self.board = board
        pcard, ppos = board.get_card_and_pos(self.board.active_player_token.map_pos)
        for g in board.tokens:
            if not isinstance(g, board.token_types['G']):
                continue
            if g.state in ['dead','unconscious']:
                continue
            gcard, gpos = board.get_card_and_pos(g.map_pos)
            if gcard!=pcard:
                continue
            if gpos == ppos: #don't move a guard on the player
                continue
            pts = gcard.spawns+gcard.waypoints
            try:
                ind = pts.index(gpos)
            except ValueError:
                continue
            ind = ind-1 if ind>0 else len(pts)-1
            g.map_pos = board.get_pos_from_card(gcard, pts[ind])


class AlertEvent(EventCard):
    def activate(self, board):
        self.board = board
        pcard, ppos = board.get_card_and_pos(self.board.active_player_token.map_pos)
        for g in board.tokens:
            if not isinstance(g, board.token_types['G']):
                continue
            gcard, gpos = board.get_card_and_pos(g.map_pos)
            if gcard!=pcard:
                continue
            if g.state=='dozing':
                g.state = 'alert'


class MoveEvent(EventCard):
    def activate(self, board):
        self.board = board
        guard = self.board.nearest_guard(self.board.active_player_token.map_pos)
        if guard is None:
            return True
        if self.board[self.board.active_player_token.map_pos] in ['U','B']:
            inc_player = False
        else:
            inc_player = True
        new_pos = self.board.guard_nearest_move(guard.map_pos, self.board.active_player_token.map_pos, include_player = inc_player)
        guard.map_pos = new_pos


class PlayerAction:
    value_per_card = 1
    base_allowance = 1
    base_noise = 1
    noise_per_stack = 0
    tap_on_use = None
    exhaust_on_use = None
    def __init__(self, card, playarea, **kwargs):
        self.spent = 0
        self.card = card
        self.playarea = playarea
        for k in kwargs:
            self.__dict__[k] = kwargs[k]

    def __call__(self, message, **kwargs):
        '''
        message is one of:
        * card_action_selected
        * card_stacked
        * map_choice_selected
        * can_cancel
        '''
        self.playarea.playerprompt.text = f'Default action handler. You should not see this text.'

    def cards_unused(self):
        num_stacked_cards = len(self.playarea.activecardsplay.cards) - 1
        if self.spent==0:
            return num_stacked_cards + 1
        elif self.spent<self.base_allowance:
            return num_stacked_cards
        else:
            return int((self.value_allowance() - self.spent)/self.value_per_card)

    def value_allowance(self):
        num_stacked_cards = len(self.playarea.activecardsplay.cards) - 1
        return self.base_allowance + self.value_per_card*num_stacked_cards
        #spent, base_allowance, value_per_card, num_cards

    def rounded_remain(self):
        return (self.value_allowance() - self.spent)//0.5 /2

    def noise_made(self):
        return self.base_noise + self.noise_per_stack*(len(self.playarea.activecardsplay.cards)-1-self.cards_unused())

class MoveAction(PlayerAction):
    def __call__(self, message, **kwargs):
        playarea= self.playarea
        board = playarea.board
        if message=='card_action_end':
            playarea.activecardsplay.discard_used(self.cards_unused(), self.noise_made(), self.exhaust_on_use, self.tap_on_use)
            return
        if message == 'can_stack':
            return True
        if message=='map_choice_selected':
            obj = kwargs['touch_object']
            self.spent += dist(obj.map_pos,board.active_player_token.map_pos)
            board.alert_nearby_guards(self.base_noise)
            board.active_player_token.map_pos = obj.map_pos
        else:
            if message=='card_action_selected':
                self.spent = 0
        moves_left = self.value_allowance() - self.spent
        spots = {}
        if not board.active_player_clashing():
            pp = board.active_player_token.map_pos
            spots = board.walkable_spots(pp, dist=moves_left, spots={})
        board.map_choices = [board.make_choice(p, self, set_choice_type(p,pp,board)) for p in spots if tuple(p)!=tuple(pp)]
        if len(board.map_choices)<1 and self.spent>0:
            playarea.activecardsplay.discard_used(self.cards_unused(), self.noise_made(), self.exhaust_on_use, self.tap_on_use)
        else:
            playarea.playerprompt.text = f'Move {self.rounded_remain()}: Touch the highlighted board spaces to move across the map.'


class GlideAction(PlayerAction):
    def __call__(self, message, **kwargs):
        playarea= self.playarea
        board = playarea.board
        if message=='card_action_end':
            playarea.activecardsplay.discard_used(self.cards_unused(), self.noise_made(), self.exhaust_on_use, self.tap_on_use)
            return
        if message == 'can_stack':
            return False
        if message=='map_choice_selected':
            obj = kwargs['touch_object']
            self.spent += dist(obj.map_pos,board.active_player_token.map_pos)
            board.alert_nearby_guards(self.base_noise)
            board.active_player_token.map_pos = obj.map_pos
            playarea.activecardsplay.discard_used(self.cards_unused(), self.noise_made(), self.exhaust_on_use, self.tap_on_use)
            return
        else:
            if message=='card_action_selected':
                self.spent = 0
        spots = []
        pp = board.active_player_token.map_pos
        if not board.active_player_clashing():
            if board[board.active_player_token.map_pos] in board.building_types:
                spots = [p for p in board.iter_types_in_range(board.active_player_token.map_pos, board.building_types, radius=self.value_allowance())
                    if board.has_types_between(p,pp,board.path_types)]
            else:
                spots = []
        board.map_choices = [board.make_choice(p, self, set_choice_type(p,pp,board,self.value_allowance()+1)) for p in spots if tuple(p)!=tuple(pp)]
        if len(board.map_choices)<1 and self.spent>0:
            playarea.activecardsplay.discard_used(self.cards_unused(), self.noise_made(), self.exhaust_on_use, self.tap_on_use)
        else:
            playarea.playerprompt.text = f'Glide {self.rounded_remain()}: Touch the highlighted board spaces to move building to building.'


class FightAction(PlayerAction):
    noise_per_stack = 1
    base_allowance = 1
    def __call__(self, message, **kwargs):
        playarea= self.playarea
        board = playarea.board
        if message=='card_action_end':
            playarea.activecardsplay.discard_used(self.cards_unused(), self.noise_made(), self.exhaust_on_use, self.tap_on_use)
            return
        if message == 'can_stack':
            return True
        if message=='map_choice_selected':
            obj = kwargs['touch_object']
            obj.token.state = 'dead'
            self.spent += 1
            board.token_update()
            #Fighting wakes up all guards on the player's card
            c, p = board.get_card_and_pos(board.active_player_token.map_pos)
            for g in board.iter_tokens('G'):
                if g.state == 'dozing':
                    if board.get_card_and_pos(g.map_pos)[0] == c:
                        g.state = 'alert'
        else:
            if message=='card_action_selected':
                self.spent = 0

        guard_choices = [t for t in board.tokens if isinstance(t,board.token_types['G']) and t.state in ['dozing','alert'] and self.rounded_remain()>=1 and dist(board.active_player_token.map_pos, t.map_pos)==0]
        map_choices = [board.make_token_choice(t, self, 'touch') for t in guard_choices]
        board.map_choices = map_choices

        if len(board.map_choices)<1 and self.spent!=0:
            playarea.activecardsplay.discard_used(self.cards_unused(), self.noise_made(), self.exhaust_on_use, self.tap_on_use)
        else:
            playarea.playerprompt.text = f'Fight {self.rounded_remain()}: Select a highlighted guard to attack.'


class SmokeBombAction(PlayerAction):
    base_allowance = 1
    def __call__(self, message, **kwargs):
        playarea= self.playarea
        board = playarea.board
        if message=='card_action_end':
            playarea.activecardsplay.discard_used(self.cards_unused(), self.noise_made(), self.exhaust_on_use, self.tap_on_use)
            return
        if message == 'can_stack':
            return True
        if message=='map_choice_selected':
            obj = kwargs['touch_object']
            guard_choices = [t for t in board.iter_tokens('G') if
                             t.state in ['dozing','alert'] and
                             self.rounded_remain()>=1 and
                             dist(obj.map_pos, t.map_pos)==0]
            for g in guard_choices:
                g.frozen = True
            self.spent += 1
            board.token_update()
            playarea.activecardsplay.discard_used(self.cards_unused(), self.noise_made(), self.exhaust_on_use, self.tap_on_use)
            return
        else:
            if message=='card_action_selected':
                self.spent = 0

        guard_choices = [t for t in board.iter_tokens('G') if
                         t.state in ['dozing','alert'] and
                         self.rounded_remain()>=1 and
                         dist(board.active_player_token.map_pos, t.map_pos)==0]
        map_choices = [board.make_choice(board.active_player_token.map_pos, self, 'touch')]
        board.map_choices = map_choices

        if len(board.map_choices)<1 and self.spent!=0:
            playarea.activecardsplay.discard_used(self.cards_unused(), self.noise_made(), self.exhaust_on_use, self.tap_on_use)
        else:
            playarea.playerprompt.text = f'Fight {self.rounded_remain()}: Select a highlighted guard to attack.'


class ClimbAction(PlayerAction):
    def __call__(self, message, **kwargs):
        playarea= self.playarea
        board = playarea.board
        if message=='card_action_end':
            playarea.activecardsplay.discard_used(self.cards_unused(), self.noise_made(), self.exhaust_on_use, self.tap_on_use)
            return
        if message == 'can_stack':
            return False
        if message=='map_choice_selected':
            obj = kwargs['touch_object']
            board.alert_nearby_guards(self.base_noise)
            playarea.board.active_player_token.map_pos = obj.map_pos
            self.spent = self.value_allowance()
        else:
            if message=='card_action_selected':
                self.spent = 0
        spots = []
        if not board.active_player_clashing():
            if board[board.active_player_token.map_pos] not in ['B','B0']:
                spots = [p for p in board.iter_types_in_range(board.active_player_token.map_pos, board.building_types, self.value_allowance())]
            else:
                spots = [p for p in board.iter_types_in_range(board.active_player_token.map_pos, board.path_types, 1)]
        board.map_choices = [board.make_choice(p, self, 'touch') for p in spots]
        if self.spent>=1:
            playarea.activecardsplay.discard_used(self.cards_unused(), self.noise_made(), self.exhaust_on_use, self.tap_on_use)
        else:
            playarea.playerprompt.text = f'Climb {self.rounded_remain()}: Touch the highlighted board spaces to climb an adjacent building.'


class KnockoutAction(PlayerAction):
    base_noise = 0
    can_loot = True #has loot that you can take
    grapple = False #drags into your space
    alert = False #can knockout if alert (also allows KO of guards sharing player's space)

    def __call__(self, message, **kwargs):
        playarea= self.playarea
        board = playarea.board
        if message=='card_action_end':
            playarea.activecardsplay.discard_used(self.cards_unused(), self.noise_made(), self.exhaust_on_use, self.tap_on_use)
            return
        if message == 'can_stack':
            return False
        if message=='map_choice_selected':
            obj = kwargs['touch_object']
            obj.token.state = 'unconscious'
            self.spent = len(playarea.activecardsplay.cards)
            board.token_update()
        else:
            if message=='card_action_selected':
                self.fight = 1
                self.spent = 0
        if not board.active_player_clashing():
            if self.alert:
                guard_choices = [t for t in board.tokens if isinstance(t,board.token_types['G']) and t.state in ['dozing','alert'] and dist(board.active_player_token.map_pos, t.map_pos)<=1]
            else:
                guard_choices = [t for t in board.tokens if isinstance(t,board.token_types['G']) and t.state in ['dozing'] and dist(board.active_player_token.map_pos, t.map_pos)<=1]
            map_choices = [board.make_token_choice(t, self, 'touch') for t in guard_choices]
            board.map_choices = map_choices
        else:
            board.map_choices = []
        if len(board.map_choices)<1 and self.spent!=0:
            draw = len(playarea.activecardsplay.cards)
            playarea.activecardsplay.discard_used(self.cards_unused(), self.noise_made(), self.exhaust_on_use, self.tap_on_use)
            pt = board.active_player_token
            if board[pt.map_pos] in board.building_types:
                pt.map_pos = obj.token.map_pos
            elif self.grapple:
                obj.token.map_pos = pt.map_pos
            if self.can_loot:
                playarea.loot1.select_draw(1, draw)
        else:
            playarea.playerprompt.text = f'Knockout {self.rounded_remain()}: Select a guard to knockout.'


class ArrowAction(PlayerAction):
    def __call__(self, message, **kwargs):
        playarea= self.playarea
        board = playarea.board
        if message=='card_action_end':
            playarea.activecardsplay.discard_used(self.cards_unused(), self.noise_made(), self.exhaust_on_use, self.tap_on_use)
            return
        if message == 'can_stack':
            return True
        if message=='map_choice_selected':
            board.alert_nearby_guards(self.base_noise)
            obj = kwargs['touch_object']
            obj.token.state = 'dead'
            self.spent = dist(board.active_player_token.map_pos, obj.token.map_pos)
            board.token_update()
        else:
            if message=='card_action_selected':
                self.spent = 0
        if not board.active_player_clashing():
            guard_choices = [t for t in board.tokens if isinstance(t,board.token_types['G']) and t.state in ['dozing','alert']
                            and 0<dist(board.active_player_token.map_pos, t.map_pos)<=self.value_allowance()
                            and board.has_line_of_sight(t.map_pos, board.active_player_token.map_pos, ['B','B0'])]
            map_choices = [board.make_token_choice(t, self, 'touch') for t in guard_choices]
            board.map_choices = map_choices
        else:
            board.map_choices = []
        if self.spent>0:
            playarea.activecardsplay.discard_used(self.cards_unused(), self.noise_made(), self.exhaust_on_use, self.tap_on_use)
        else:
            playarea.playerprompt.text = f'Shoot arrow {self.rounded_remain()}: Select a guard to shoot.'


class GasAction(PlayerAction):
    radius = 0
    def __call__(self, message, **kwargs):
        playarea= self.playarea
        board = playarea.board
        if message=='card_action_end':
            playarea.activecardsplay.discard_used(self.cards_unused(), self.noise_made(), self.exhaust_on_use, self.tap_on_use)
            return
        if message == 'can_stack':
            return True
        if message=='map_choice_selected':
            board.alert_nearby_guards(self.base_noise)
            obj = kwargs['touch_object']
            self.spent = dist(board.active_player_token.map_pos, obj.map_pos)
            guards_affected = [t for t in board.iter_tokens('G') if t.state in ['dozing','alert'] and 0<=dist(obj.map_pos, t.map_pos)<=self.radius]
            for g in guards_affected:
                g.state = 'unconscious'
            board.token_update()
            playarea.activecardsplay.discard_used(self.cards_unused(), self.noise_made(), self.exhaust_on_use, self.tap_on_use)
            return
        else:
            if message=='card_action_selected':
                self.spent = 0
        if not board.active_player_clashing():
            pp = board.active_player_token.map_pos
            map_choices = [board.make_choice(t, self, 'touch') for t in board.iter_types_in_range(pp, board.path_types, radius=self.value_allowance()) if board.has_line_of_sight(t, pp, board.building_types)]
            board.map_choices = map_choices
        else:
            board.map_choices = []
        if self.spent>0:
            playarea.activecardsplay.discard_used(self.cards_unused(), self.noise_made(), self.exhaust_on_use, self.tap_on_use)
        else:
            playarea.playerprompt.text = f'Shoot arrow {self.rounded_remain()}: Select a space to shoot gas arrow.'


class DimmerAction(PlayerAction):
    radius = 0
    def __call__(self, message, **kwargs):
        playarea= self.playarea
        board = playarea.board
        if message=='card_action_end':
            playarea.activecardsplay.discard_used(self.cards_unused(), self.noise_made(), self.exhaust_on_use, self.tap_on_use)
            return
        if message == 'can_stack':
            return True
        if message=='map_choice_selected':
            board.alert_nearby_guards(self.base_noise)
            obj = kwargs['touch_object']
            self.spent = dist(board.active_player_token.map_pos, obj.map_pos)
            board.hide_light(obj.map_pos)
            playarea.activecardsplay.discard_used(self.cards_unused(), self.noise_made(), self.exhaust_on_use, self.tap_on_use)
            return
        else:
            if message=='card_action_selected':
                self.spent = 0
        if not board.active_player_clashing():
            pp = board.active_player_token.map_pos
            map_choices = [board.make_choice(p, self, 'touch') for p in board.iter_lights()
                            if 0<=dist(p, pp)<=self.value_allowance() and
                            board.has_line_of_sight(p, pp, board.building_types)]
            board.map_choices = map_choices
        else:
            board.map_choices = []
        if self.spent>0:
            playarea.activecardsplay.discard_used(self.cards_unused(), self.noise_made(), self.exhaust_on_use, self.tap_on_use)
        else:
            playarea.playerprompt.text = f'Shoot dimmer arrow {self.rounded_remain()}: Select a space to shoot gas arrow.'


class LockpickAction(PlayerAction):
    base_allowance = 1
#    noise_per_stack = 1
    can_loot = True
    max_loot = 3
    def __call__(self, message, **kwargs):
        playarea= self.playarea
        board = playarea.board
        if message=='card_action_end':
            playarea.activecardsplay.discard_used(self.cards_unused(), self.noise_made(), self.exhaust_on_use, self.tap_on_use)
            return
        if message == 'can_stack':
            return True
        if message=='map_choice_selected':
            obj = kwargs['touch_object']
            target = [t for t in board.iter_tokens(token_type='T') if t.map_pos==obj.map_pos]
            if len(target)>0:
                target = target[0]
                pick = self.value_allowance()
                board.alert_nearby_guards(self.base_noise)
                if pick>=target.lock_level: #TODO: This check should happen earlier
                    target.picked=True
                    board.tokens.remove(target)
                    self.spent = pick
                    if target.has_loot:
                        loot_decks = [playarea.loot1, playarea.loot2, playarea.loot3]
                        loot_decks[target.loot_level-1].select_draw(1, 1 + pick - target.lock_level)
                        self.loot_pos = target.map_pos
            else:
                board.alert_nearby_guards(self.base_noise)
                if self.loot_pos is None:
                    self.spent=1
                board.active_player_token.map_pos = obj.map_pos
                playarea.activecardsplay.discard_used(self.cards_unused(), self.noise_made(), self.exhaust_on_use, self.tap_on_use)
                return
        elif message=='card_action_selected':
            self.spent = 0
            self.loot_pos=None
        p = board.active_player_token
        board.map_choices = []
        if not board.active_player_clashing():
            if self.loot_pos is not None:
                move_choices = [m for m in board.iter_types_in_range(self.loot_pos,board.path_types,radius=1) if dist(self.loot_pos, m)>=1]
                target_choices = list(set(move_choices))
                map_choices = [board.make_choice(t, self, set_choice_type(t,p.map_pos,board,3)) for t in target_choices]
                board.map_choices = map_choices
            elif board[board.active_player_token.map_pos] not in board.building_types:
                target_choices = [t for t in board.iter_targets() if dist(p.map_pos, t)==1]
                move_choices = [m for b in board.iter_types_in_range(p.map_pos,'B',radius=1)
                                    for m in board.iter_types_in_range(b,board.path_types,radius=1)
                                    if dist(p.map_pos, m)>=1]
                target_choices += list(set(move_choices))
                map_choices = [board.make_choice(t, self, set_choice_type(t,p.map_pos,board,3)) for t in target_choices]
                board.map_choices = map_choices
        if len(board.map_choices)<1 and self.spent!=0:
            playarea.activecardsplay.discard_used(self.cards_unused(), self.noise_made(), self.exhaust_on_use, self.tap_on_use)
        else:
            playarea.playerprompt.text = f'Lockpick {self.rounded_remain()}: Select a guard to knockout.'


class DecoyAction(PlayerAction):
    base_allowance = 3
    def __call__(self, message, **kwargs):
        playarea= self.playarea
        board = playarea.board
        if message=='card_action_end':
            playarea.activecardsplay.discard_used(self.cards_unused(), self.noise_made(), self.exhaust_on_use, self.tap_on_use)
            return
        if message == 'can_stack':
            return True
        if message=='map_choice_selected':
            #TODO: Could use this and commented block below to implement a noisy decoy that drags all enemies on card to one place (might be a bit op)
            #            player_c, p = board.get_card_and_pos(board.active_player_token.map_pos)
            obj = kwargs['touch_object']
            for t in board.tokens:
                if isinstance(t,board.token_types['G']) and t.state in['alert','dozing'] and 0<dist(t.map_pos,obj.map_pos)<=10:
                    if not board.has_types_between(t.map_pos, obj.map_pos, board.building_types):
                        t.map_pos = obj.map_pos
                        t.state = 'alert'
            self.spent = dist(obj.map_pos, board.active_player_token.map_pos)
            playarea.activecardsplay.discard_used(self.cards_unused(), self.noise_made(), self.exhaust_on_use, self.tap_on_use)
            return
        else:
            if message=='card_action_selected':
                self.spent = 0
        if not board.active_player_clashing():
            pp = board.active_player_token.map_pos
            place_choices = [t for t in board.iter_types_in_range(pp, board.path_types, self.value_allowance())
                             if board.has_line_of_sight(t, pp, board.building_types)]
            map_choices = [board.make_choice(t, self, 'touch') for t in place_choices]
            board.map_choices = map_choices
        else:
            board.map_choices = []
        if self.spent!=0:
            playarea.activecardsplay.discard_used(self.cards_unused(), self.noise_made(), self.exhaust_on_use, self.tap_on_use)
        else:
            playarea.playerprompt.text = f'Shoot decoy {self.rounded_remain()}: Select a tile to shoot the decoy to.'


class MarketAction(PlayerAction):
    base_allowance = 1
    def __call__(self, message, **kwargs):
        playarea= self.playarea
        board = playarea.board
        if message=='card_action_end':
            playarea.activecardsplay.discard_used(self.cards_unused(), self.noise_made(), self.exhaust_on_use, self.tap_on_use)
            return
        if message == 'can_stack':
            return isinstance(kwargs['stacked_card'],TreasureCard) #TODO: Instead base on wheter the card has a MarketAction action
        if message=='map_choice_selected':
            board.alert_nearby_guards(self.base_noise)
            obj = kwargs['touch_object']
            market = [t for t in board.iter_tokens(token_type='M') if t.map_pos==obj.map_pos]
            if len(market)>0:
                self.spent = self.value_allowance() #TODO: Use the sum of MarketAction values
                self.market_pos = obj.map_pos
                playarea.marketdeck.select_draw(1,4,self.spent)
            else:
                board.active_player_token.map_pos = obj.map_pos
                playarea.activecardsplay.discard_used(self.cards_unused(), self.noise_made(), self.exhaust_on_use, self.tap_on_use)
                return
        elif message=='card_action_selected':
            self.spent = 0
            self.market_pos=None
        p = board.active_player_token
        board.map_choices = []
        if not board.active_player_clashing():
            if self.market_pos is not None:
                move_choices = [m for m in board.iter_types_in_range(self.market_pos,board.path_types,radius=1) if dist(self.market_pos, m)>=1]
                target_choices = list(set(move_choices))
                map_choices = [board.make_choice(t, self, set_choice_type(t,p.map_pos,board,3)) for t in target_choices]
                board.map_choices = map_choices
            elif board[board.active_player_token.map_pos] not in board.building_types:
                target_choices = [t for t in board.iter_markets() if dist(p.map_pos, t)==1]
                map_choices = [board.make_choice(t, self, set_choice_type(t,p.map_pos,board,3)) for t in target_choices]
                board.map_choices = map_choices
        if len(board.map_choices)<1 and self.spent!=0:
            playarea.activecardsplay.discard_used(self.cards_unused(), self.noise_made(), self.exhaust_on_use, self.tap_on_use)
        else:
            playarea.playerprompt.text = f'Buy {self.rounded_remain()}: Select a market card to buy.'


#Trait cards: player specific actions and powers are captured in their trait cards. Cards are represented in a stack but their abilities are always available (unless otherwise noted)
class TraitCard(Card):
    tapped = BooleanProperty(False)
    exhausted = BooleanProperty(False)

    def get_actions_for_card(self, card):
        return {}


class MoveTrait(TraitCard):
    #All move cards gain +1
    #All non-move cards can be used for move 1
    def get_actions_for_card(self, card, playarea):
        if self.tapped or self.exhausted:
            return {}
        else:
            return {'MOVE 1+': MoveAction(card, playarea, base_allowance=1, tap_on_use=self),
                    }


class FightTrait(TraitCard):
    #Get +1 to attack cards
    #Play 1 non-attack card for attack 1
    def get_actions_for_card(self, card, playarea):
        if self.tapped or self.exhausted:
            return {}
        else:
            return {'ATTACK 0.5+': FightAction(card, playarea, base_allowance=0.5, value_per_card=0.5, tap_on_use=self),
                    }


class ClimbTrait(TraitCard):
    def get_actions_for_card(self, card, playarea):
        if self.tapped or self.exhausted:
            return {}
        else:
            return {'CLIMB 1': ClimbAction(card, playarea, tap_on_use=True),
                }


class SneakTrait(TraitCard):
    #All cards used for move actions make no noise
    #All cards can be used for move 0.5
    #All non-move cards can be used for KO action on dozing guards from shadows
    def get_actions_for_card(self, card, playarea):
        if self.tapped or self.exhausted:
            return {}
        else:
            return {'KNOCKOUT': KnockoutAction(card, playarea, base_allowance=1, tap_on_use=True),
                }

class LootTrait(TraitCard):
    #Spend card to enter buildings
    #Spend card to gather loot (stacked cards allow extra draws from loot deck)
    #Gain +1 to loot cards
    #All non-loot cards can be used for loot 1
    #All non-loot cards can be spent to increase draw additional market cards to buy from
    #Spend 2 cards to buy an additional market item
    def get_actions_for_card(self, card, playarea):
        if self.tapped or self.exhausted:
            return {}
        else:
            return {
                    'LOCKPICK 1+': LockpickAction(card, playarea, base_allowance=1, tap_on_use=True),
               }

class ArcherTrait(TraitCard):
    #Archer stance (holding your bow) is required to shoot arrows
    #TODO: Upgrading the archer stance should offer additional range etc.
    def get_actions_for_card(self, card, playarea):
        if self.tapped or self.exhausted:
            return {}
        else:
            return {'ARROW 3+': ArrowAction(card, playarea, base_allowance=3, tap_on_use=True),
                }

def stack_all_fn(card):
    return True

def set_choice_type(pos1, pos2, board, dist_cap=2):
    if dist(pos1, pos2)<dist_cap:
        visible = False
        if board[pos1] not in ['B','U']:
            visible = len([g for g in board.iter_tokens('G')
                if g.state in ['alert','dozing'] and not g.frozen
                and dist(g.map_pos,pos1)<=10
                and not board.has_types_between(g.map_pos,pos1,'B')])>0
        if visible:
            return 'visible'
        else:
            return 'touch'
    return 'info'


class PlayerCard(Card):
    def get_actions(self, playarea):
        return {}

class StartPlayerCard(PlayerCard): #TODO: pretty ugly to use a subclass for this (also not compatible with multiple classes of player characters)
    pass

class LootCard(PlayerCard):
    pass

class SkillCard(PlayerCard):
    pass

class TreasureCard(LootCard):
    def get_actions(self, playarea):
        return {'BUY 1+': MarketAction(self, playarea, base_allowance=1, value_per_card=1, exhaust_on_use=self)}

class SkeletonKey(LootCard):
    def get_actions(self, playarea):
        return {'LOCKPICK 4+': LockpickAction(self, playarea, base_allowance=4, value_per_card=1, exhaust_on_use=self)}

class MarketCard(PlayerCard):
    pass

class GasArrow(MarketCard):
    def get_actions(self, playarea):
        return {'SHOOT GAS 3+': GasAction(self, playarea, base_allowance=3, value_per_card=2, radius=1, exhaust_on_use=self)}

class RopeArrow(MarketCard):
    def get_actions(self, playarea):
        return {'CLIMB 1.5': ClimbAction(self, playarea, base_allowance=1.5, value_per_card=1, max_height=2),
                'TRAVERSE 2': GlideAction(self, playarea, base_allowance=2, value_per_card=1, max_height=2, exhaust_on_use=self)
        }

class DimmerArrow(MarketCard):
    def get_actions(self, playarea):
        return {'SHOOT DIMMER 3+': DimmerAction(self, playarea, base_allowance=3, value_per_card=2, exhaust_on_use=self)}

class DecoyArrow(MarketCard):
    def get_actions(self, playarea):
        return {'SHOOT DECOY 3+': DecoyAction(self, playarea, base_allowance=3, value_per_card=2, exhaust_on_use=self)}

class SmokeBomb(MarketCard):
    def get_actions(self, playarea):
        return {'SMOKE BOMB': SmokeBombAction(self, playarea, base_allowance=3, value_per_card=2, exhaust_on_use=self)}

class Lure(MarketCard):
    #Lures but does not alert guard in sight of player to a position adjacent
    pass

class BasicMove(StartPlayerCard):
    def get_actions(self, playarea):
        return {'MOVE 1.5+': MoveAction(self, playarea, base_allowance=1.5, value_per_card=1.5)}

class BasicAttack(StartPlayerCard):
    def get_actions(self, playarea):
        return {'ATTACK 1+': FightAction(self, playarea, base_allowance=2)}

class BasicClimb(StartPlayerCard):
    def get_actions(self, playarea):
        return {'CLIMB 1': ClimbAction(self, playarea)}

class BasicSneak(StartPlayerCard):
    def get_actions(self, playarea):
        return {'SNEAK 1+': MoveAction(self, playarea, base_allowance=1, value_per_card=1, base_noise=0, noise_per_stack=0)}

class BasicKockout(StartPlayerCard):
    def get_actions(self, playarea):
        return {'KNOCKOUT': KnockoutAction(self, playarea)}

class BasicArrow(StartPlayerCard):
    def get_actions(self, playarea):
        return {'SHOOT ARROW 3': ArrowAction(self, playarea, base_allowance=3, value_per_card=2, exhaust_on_use=self)}

class BasicLockpick(StartPlayerCard):
    def get_actions(self, playarea):
        return {'LOCKPICK 1+': LockpickAction(self, playarea, base_allowance=1)}

class EfficientMove(SkillCard):
    def get_actions(self, playarea):
        return {'MOVE 2+': MoveAction(self, playarea, base_allowance=2, value_per_card=2)}

class EfficientAttack(SkillCard):
    def get_actions(self, playarea):
        return {'ATTACK 2+': FightAction(self, playarea, base_allowance=2)}

class EfficientClimb(SkillCard):
    def get_actions(self, playarea):
        return {'CLIMB 1.5': ClimbAction(self, playarea)}

class EfficientSneak(SkillCard):
    def get_actions(self, playarea):
        return {'SNEAK 1.5+': MoveAction(self, playarea, base_allowance=1, value_per_card=1.5, base_noise=0, noise_per_stack=0)}

class EfficientKockout(SkillCard):
    def get_actions(self, playarea):
        return {'KNOCKOUT': KnockoutAction(self, playarea)} #TODO: FIXME

class EfficientArrow(SkillCard):
    def get_actions(self, playarea):
        return {'SHOOT ARROW 5': ArrowAction(self, playarea, base_allowance=5, value_per_card=2, exhaust_on_use=self)}

class EfficientLockpick(SkillCard):
    def get_actions(self, playarea):
        return {'LOCKPICK 2+': LockpickAction(self, playarea, base_allowance=2)}


class Mission(Card):
    mission_level = 1

    def __init__(self, **kwargs):
        super().__init__()
        for k in kwargs:
            self.__dict__[k] = kwargs[k]

    def setup_events(self):
        pass

    def setup_map(self):
        pass

class ContactMission(Mission):
    def setup_events(self, playarea):
        events = make_event_cards(playarea)
        random.shuffle(events)
        return events

    def setup_map(self, playarea):
        w, h = playarea.map_card_grid_size
        map_cards = []
        #Mission level scaling
        lev_add_on = min(self.mission_level//playarea.map_size[0],2)
        lev_thresh = playarea.map_size[0] - self.mission_level%playarea.map_size[0]
        for y in range(playarea.map_size[1]):
            for x in range(playarea.map_size[0]):
                lev = 1+x//2 + (x>=lev_thresh)*lev_add_on #cards ramp up difficulty from left to right
                map_cards.append(CityMap(pa=playarea, w=w, h=h, card_level=lev))
        return map_cards

class DeliveryMission(Mission):
    mission_level = 1

    def setup_events(self):
        pass

    def setup_map(self):
        pass


class AssassinMission(Mission):
    mission_level = 1

    def setup_events(self):
        pass

    def setup_map(self):
        pass

def make_map_cards(pa, w, h, n):
    return [m(pa=pa, w=w, h=h) for m in MapCard.__subclasses__() for i in range(n)]

def make_event_cards(pa):
    return [m(pa=pa) for m in EventCard.__subclasses__() for i in range(3)]

def make_skill_cards(pa):
    return [h(pa=pa) for h in SkillCard.__subclasses__() for j in range(10)]

def make_loot_cards(pa):
    return [[h(pa=pa) for h in LootCard.__subclasses__() for j in range(10)] for i in range(3)]

def make_market_cards(pa):
    return [h(pa=pa) for h in MarketCard.__subclasses__() for i in range (20)]

def make_player_cards(pa):
    return [m(pa=pa) for m in StartPlayerCard.__subclasses__() for i in range(2)] + [m(pa=pa) for m in [DecoyArrow, RopeArrow, GasArrow, SmokeBomb, DimmerArrow]]

def make_trait_cards(pa):
    return [m(pa=pa) for m in [MoveTrait, FightTrait]]
