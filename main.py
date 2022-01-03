import random
import os
import math
#import sounds

#os.environ['KIVY_GL_DEBUG'] = '1'
#os.environ['KIVY_GL_BACKEND'] = 'sdl2'


import kivy
kivy.require('1.8.0')

#__version__ = '0.1.5'

def get_user_path():
    """ Return the folder to where user data can be stored """
    root = os.getenv('EXTERNAL_STORAGE') or os.path.expanduser("~")
    path = os.path.join(root, ".Sneaky")
    if not os.path.exists(path):
        os.makedirs(path)
    print('user path',path)
    return path

import colors

from functools import partial
#from kivy.uix.listview import ListView, ListItemLabel, ListItemButton
from kivy.uix.floatlayout import FloatLayout
from kivy.uix.relativelayout import RelativeLayout
from kivy.uix.boxlayout import BoxLayout
from kivy.uix.gridlayout import GridLayout
from kivy.app import App
from kivy.uix.image import Image
from kivy.properties import StringProperty, ListProperty, NumericProperty, \
    BooleanProperty, ObjectProperty, DictProperty, ReferenceListProperty
from kivy.graphics import Rectangle, Color
from kivy.clock import Clock
from kivy.core.window import Window
from kivy.lang import Builder
from kivy.vector import Vector
from kivy.animation import Animation
from kivy.logger import Logger
from kivy.storage.jsonstore import JsonStore
#from kivy.utils import platform

import cards

''' ###PC/Tablet Layout###
Table Layout

City                          Loot A Loot B Loot C Market
+====++====++====++====+      |    | |    | |    | |    |
|    ||    ||    ||    |      +====+ +====+ +====+ +====+
|    ||    ||    ||    |
+====++====++====++====+
|    ||    ||    ||    |      Market
|    ||    ||    ||    |      +====+ +====+ +====+ +====+
+====++====++====++====+      |    | |    | |    | |    |
|    ||    ||    ||    |      |    | |    | |    | |    |
|    ||    ||    ||    |      +====+ +====+ +====+ +====+
+====++====++====++====+

   Played cards                                 Exhausted
   +=+=+=+=+=+=+====+                              +====+
   | | | | | | |    |                              |    |
   | | | | | | |    |                              |    |
   +=+=+=+=+=+=+====+                              +====+
 Draw   Discard   Hand
 +====+ +====+    +=+=+=+=+=+=+====+
 |    | |    |    | | | | | | |    |
'''


class CardSplayCloseup(RelativeLayout):
    cards = ListProperty()
    def __init__(self,closeup_card,*args,**kwargs):
        super().__init__(*args, **kwargs)
        self.size_hint = (1,1)
        if closeup_card is not None:
            self.aspect = closeup_card.width/closeup_card.height
            self.closeup_card = type(closeup_card)()
            self.closeup_card.face_up=True
            self.add_widget(self.closeup_card)
            self._touch_down = False

    def on_size(self,*args):
        width = int(self.height*self.aspect)
        self.closeup_card.size = (width,self.height)
        if len(self.cards) == 0:
            self.closeup_card.x = (self.width-width)//2
        else:
            self.closeup_card.pos = (0,0)

    def on_touch_down(self,touch):
       if self.collide_point(*touch.pos):
           self._touch_down = True
       return True

    def on_touch_up(self,touch):
       if self._touch_down and self.collide_point(*touch.pos):
           self.parent.remove_widget(self)
       return True
#    def on_cards(self,*args):

#class CardSplay0(RelativeLayout):
#    pass

class CardSplay(RelativeLayout):
    cards = ListProperty()
    orientation = StringProperty('horizontal')

    def __init__(self, **kwargs):
        if 'card_spread_scale' in kwargs:
            self.card_spread_scale = kwargs['card_spread_scale']
            del kwargs['card_spread_scale']
        else:
            self.card_spread_scale = 0.5
        super().__init__(**kwargs)
#        super().__init__(*args, **kwargs)
#        self.size_hint = (None,None)
        self.touch_card = None
        self._clockev = None

    def do_closeup(self, closeup_card, time):
        self.parent.add_widget(CardSplayCloseup(closeup_card))

    def on_cards(self,*args):
        for c in self.children[:]:
            if isinstance(c, cards.Card):
                self.remove_widget(c)
        for c in self.cards:
            self.add_widget(c)
        self.splay_cards()

    def on_size(self, *args):
        self.on_cards()

    def splay_cards(self):
        if len(self.cards)==0:
            return
        cardw = self.parent.card_size[0]
        cardh = self.parent.card_size[1]
        if self.orientation=='horizontal':
            offset = 0
            if len(self.cards)>1:
                delta = int(max(min(cardw*self.card_spread_scale, (self.width-cardw)/(len(self.cards)-1)),2))
            else:
                delta = 0
        else:
            offset = self.height-cardh
            if len(self.cards)>1:
                delta = -int(max(min(cardh*self.card_spread_scale, (self.height-cardh)/(len(self.cards)-1)),2))
            else:
                delta = 0
        if delta==2:
            max_splay = (self.width-cardw)//2
        else:
            max_splay = len(self.cards)
        i=0
        for c in self.cards:
            if self.orientation=='horizontal':
                c.x = offset
                c.y = 0
            else:
                c.y = offset
                c.x = 0
#            c.size = self.parent.card_size
            if i<max_splay:
                offset+=delta
            i+=1

    def on_touch_down(self, touch):
        for c in self.cards[::-1]:
            if c.collide_point(*self.to_local(*touch.pos)):
                self._clockev = Clock.schedule_once(partial(self.do_closeup,c), 0.5)
                break
        if len(self.cards)>0:
            c = self.cards[-1]
            if c.collide_point(*self.to_local(*touch.pos)):
                self.touch_card = c

    def on_touch_up(self, touch):
        if self._clockev != None:
            self._clockev.cancel()
            self._clockev = None


class PlayerDiscard(CardSplay):
    def on_cards(self, *args):
        super().on_cards(*args)
        for c in self.cards:
            c.face_up = True


class PlayerDeck(CardSplay):
    can_draw = True
    def on_cards(self, *args):
        super().on_cards(*args)
        for c in self.cards:
            c.face_up = False

    def on_touch_up(self,touch):
        super().on_touch_up(touch)
        if len(self.cards)==0:
            return False
        if not self.collide_point(*touch.pos):
            return False
        if not self.can_draw:
            return True
        for c in self.cards[-1:-6:-1]:
            self.cards.remove(c)
            self.parent.hand.cards.append(c)
        self.can_draw = False
        return True

class PlayerTableau(CardSplay):
    def on_touch_up(self,touch):
        super().on_touch_up(touch)
        i = len(self.cards) - 1
        while i>=0:
            c = self.cards[i]
            if c.collide_point(*self.to_local(*touch.pos)):
                c.selected = not c.selected
                if c.selected == True:
                    for j in range(i,len(self.cards)):
                        self.cards[j].selected = True
                else:
                    for j in range(0,i):
                        self.cards[j].selected = False
                return True
            i-=1

    def on_cards(self, *args):
        for c in self.cards:
            c.face_up = True
            c.selected = False
        super().on_cards(*args)
        #clear the touch targets
        pass


class Hand(CardSplay):
    def on_touch_up(self,touch):
        super().on_touch_up(touch)
        if len(self.cards)==0:
            return False
        c = self.cards[-1]
        for c in self.cards[::-1]:
            if c.collide_point(*self.to_local(*touch.pos)):
                self.cards.remove(c)
                self.parent.playertableau.cards.append(c)
                c.activate(self.parent.board)
                return False

#    def on_size(self,*args):
#        super().on_size(*args)
#        for c in self.cards:
#            if c.type=='ARSENAL':
#                if c.selected==True:
#                    c.y+=10

    def on_cards(self, *args):
        for c in self.cards:
            c.face_up = True
            c.selected = False
        super().on_cards(*args)


class LootDeck(CardSplay):
    def on_touch_up(self,touch):
        super().on_touch_up(touch)


class MarketDeck(CardSplay):
    def on_touch_up(self,touch):
        super().on_touch_up(touch)


class MarketOffer(CardSplay):
    def __init__(self, **kwargs):
        kwargs['card_spread_scale'] = 1.0
        super().__init__(**kwargs)

    def on_touch_up(self,touch):
        super().on_touch_up(touch)

    def on_cards(self, *args):
        for c in self.cards:
            c.face_up = True
        super().on_cards(*args)


class Exhausted(CardSplay):
    def on_touch_up(self,touch):
        super().on_touch_up(touch)


class EventDeck(CardSplay):
    def on_touch_up(self,touch):
        super().on_touch_up(touch)
        if not self.collide_point(*touch.pos):
            return False
        if len(self.cards)==0:
            return False
        card= self.cards[-1]
        card.face_up = True
        print('EVENT CARD TAPPED', card)
        self.cards.remove(card)
        card.activate(self.parent.board)
        self.parent.eventdiscard.cards.append(card)
        for c in self.parent.playertableau.cards[:]:
            self.parent.playertableau.cards.remove(c)
            self.parent.playerdiscard.cards.append(c)
        self.parent.playerdeck.can_draw = True
        return True


class EventDiscard(CardSplay):
    def on_touch_up(self,touch):
        super().on_touch_up(touch)


class Map(GridLayout):
    cards = ListProperty()
    def __init__(self,*args,**kwargs):
        super().__init__(*args,**kwargs)
        self.orientation='lr-tb'
        self.size_hint = None, None

    def on_cards(self,*args):
        for c in self.children[:]:
            if isinstance(c, cards.Card):
                self.remove_widget(c)
        for c in self.cards:
            c.face_up = True
            self.add_widget(c)

    def on_touch_up(self,touch):
        return


class Board(RelativeLayout):
    tokens = ListProperty()
    map_choices = ListProperty()
    space_size = ListProperty()
    w = NumericProperty()
    h = NumericProperty()

    def on_tokens(self, *args):
        self.active_player_token = None
        for t in self.children[:]:
            if isinstance(t,Token):
                self.remove_widget(t)
        for t in self.tokens:
            if isinstance(t,Token):
                self.add_widget(t)
                t.size = self.space_size
            if isinstance(t,PlayerToken):
                self.active_player_token = t

    def on_map_choices(self, *args):
        for t in self.children[:]:
            if isinstance(t,MapChoice):
                self.remove_widget(t)
        for t in self.map_choices:
            if isinstance(t,MapChoice):
                self.add_widget(t)
                t.size = self.space_size

    def on_space_size(self, *args):
        for t in self.tokens:
            t.size = self.space_size
        for c in self.map_choices:
            c.size = self.space_size

    def __getitem__(self, pos):
        card, card_pos = self.get_card_and_pos(pos)
        return card.map[card_pos]

    def get_card_and_pos(self,pos):
        '''
        get card grid position of a board grid position `pos`.
        returns both the card and the grid position on the card
        '''
        x,y = pos
        card_x = x//self.map_card_grid_size[0]
        card_y = y//self.map_card_grid_size[1]
        card_ind = card_x + card_y*self.map.cols
        card = self.map.cards[card_ind]
        card_pos = x-card_x*self.map_card_grid_size[0], y-card_y*self.map_card_grid_size[1]
        return card, card_pos

    def get_pos_from_card(self, card, pos=(0,0)):
        x,y = pos
        card_ind = self.map.cards.index(card)
        card_y = card_ind//self.map.cols
        card_x = card_ind - card_y*self.map.cols
        x,y = x + card_x * self.map_card_grid_size[0], y + card_y * self.map_card_grid_size[1]
        return x,y

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

    def make_choice(self, map_pos, listener):
        return MapChoice(map_pos=map_pos, listener=listener)

    def iter_spawns(self):
        for c in self.map.cards:
            for s in c.spawns:
                yield self.get_pos_from_card(c,s)

    def iter_waypoints(self):
        for c in self.map.cards:
            for w in c.spawns+c.waypoints:
                yield self.get_pos_from_card(c,w)

    def iter_targets(self, map_pos):
        for c in self.map.cards:
            for t in c.targets:
                yield self.get_pos_from_card(c,t)

    def nearest_guard(self, map_pos, max_range=None):
        gts = [t for t in self.tokens if isinstance(t,GuardToken)]
        dists = [self.dist(map_pos,t.map_pos) for t in gts]
        print('Nearest guard dists',dists)
        min_dist = min(dists)
        if max_range is not None:
            if min_dist>max_range:
                return None
        return gts[dists.index(min_dist)]

    def nearest_waypoint(self, map_pos, max_range=None):
        wps = [wp for wp in self.iter_waypoints(map_pos)]
        dists = [self.dist(map_pos,t) for t in wps]
        min_dist = min(dists)
        if max_range is not None:
            if min_dist>max_range:
                return None
        return wps[dists.index(min_dist)]

    def guard_nearest_move(self, guard_pos, player_pos, max_dist=1000):
        g_to_p_dist = self.dist(player_pos, guard_pos)
        wps = [wp for wp in self.iter_waypoints()]
        candidates = []
        smallest_dist = max_dist
        for wp in wps:
            p_to_wp_dist = self.dist(wp, player_pos)
            g_to_wp_dist = self.dist(wp, guard_pos)
            if g_to_wp_dist<g_to_p_dist and p_to_wp_dist<g_to_p_dist and p_to_wp_dist<=smallest_dist:
                smallest_dist = p_to_wp_dist
                candidates.append(wp)
        if len(candidates)==0:
            return player_pos
        else:
            return candidates[0]

    def walkable_dist(self, map_pos1, map_pos2):
        pass

    def dist(self, map_pos1, map_pos2):
        return ((map_pos1[0]-map_pos2[0])**2 + (map_pos1[1]-map_pos2[1])**2)**0.5

    def walkable_spots(self, map_pos, dist, spots):
        if len(spots)==0:
            spots[tuple(map_pos)] = 0
        walk_costs = {'B': 4, 'U': 1, 'L': 1}
        for pos in self.iter_in_range(map_pos,1.5):
            if tuple(pos) in spots:
                continue
            if self[pos] in walk_costs:
                cur_dist = spots[tuple(map_pos)]+walk_costs[self[pos]]*self.dist(pos,map_pos)
                if cur_dist <= dist:
                    spots[tuple(pos)] = cur_dist
                    self.walkable_spots(pos, dist, spots)
        return spots


def extract_kwarg(kwargs,name,default=None):
    if name in kwargs:
        ret = kwargs[name]
        del kwargs[name]
    else:
        ret = default
    return ret


class Token(BoxLayout):
    map_pos = ListProperty()
    def __init__(self, **kwargs):
        map_pos = extract_kwarg(kwargs,'map_pos',(0,0))
        super().__init__(**kwargs)
        self.map_pos = map_pos

class PlayerToken(Token):
    pass


class GuardToken(Token):
    state = 'dozing' #dozing, alert, unconscious, dead


class MapChoice(BoxLayout):
    def __init__(self, **kwargs):
        map_pos = extract_kwarg(kwargs,'map_pos',(0,0))
        listener = extract_kwarg(kwargs,'listener')
        super().__init__(**kwargs)
        self.map_pos = map_pos
        self.listener = listener
    def on_touch_up(self, touch):
        if self.collide_point(*touch.pos):
            self.listener(self)


class PlayArea(FloatLayout):

    def __init__(self,**kwargs):
        super().__init__(**kwargs)
        self.menu = Menu()
        self.instructions = None
        self.menu.bind(selection = self.menu_choice)
        self.first_start = True

    def on_parent(self, *args):
        self.mapcards = cards.make_map_cards(self, self.map_card_grid_size[0], self.map_card_grid_size[1])
        self.playercards = cards.make_player_cards(self)
        self.lootcards = cards.make_loot_cards(self)
        self.marketcards = cards.make_market_cards(self)
        self.eventcards = cards.make_event_cards(self)

        self.card_setup()
        self.token_setup()

    def card_setup(self):
        random.shuffle(self.playercards)
        random.shuffle(self.mapcards)
        for l in self.lootcards:
            random.shuffle(l)
        random.shuffle(self.marketcards)
        random.shuffle(self.eventcards)

        self.map.cards[:] = self.mapcards[:12] #[:self.map.rows*self.map.cols]

        self.playerdeck.cards[:] = self.playercards[:]
        self.playerdiscard.cards[:] = []
        self.playertableau.cards[:] = []

        self.loot1.cards[:] = self.lootcards[0][:]
        self.loot2.cards[:] = self.lootcards[1][:]
        self.loot3.cards[:] = self.lootcards[2][:]

        self.exhausted.cards[:] = []

        self.marketdeck.cards[:] = self.marketcards[4:]
        self.marketoffer.cards[:] = self.marketcards[:4]

        self.eventdeck.cards[:] = self.eventcards[:]
        self.eventdiscard.cards[:] = []

    def token_setup(self):
        player = PlayerToken()
        spawns = []
        for c in self.map.cards:
            spawns += [self.board.get_pos_from_card(c,s) for s in c.spawns]
        guards = [GuardToken(map_pos=s) for s in spawns]
        self.board.tokens = [player]+guards

    def show_menu(self):
        self.menu.selection = -1
        self.add_widget(self.menu)

    def hide_menu(self):
        self.remove_widget(self.menu)

    def menu_choice(self, menu, selection):
        if selection == 1:
            self.hide_menu()
            self.restart_game()
        if selection == 2:
            self.hide_menu()
            self.next_game()
        if selection == 3:
            self.hide_menu()
            self.prev_game()
        if selection == 4:
            self.hide_menu()
            self.add_widget(self.instructions)
        if selection == 5:
            App.get_running_app().set_next_theme()
            self.hide_menu()
            self.show_menu()
        if selection == 6:
            App.get_running_app().stop()

    def next_game(self):
        self.reset(True)

    def prev_game(self):
        self.reset(True)

    def restart_game(self):
        self.reset()

    def draw_background(self, candidates = None):
        return
        self.canvas.before.clear()
        with self.canvas.before:
            Color(*colors.background)
            Rectangle(pos = self.pos, size = self.size)
#
    def update_word_bar(self):
        self.statusbar.word, self.statusbar.word_score = self.is_selection_a_word()

    def path_state(self):
        return os.path.join(get_user_path(),'gamestate.pickle')

    def load_state(self):
        path = self.path_state()
        if not os.path.exists (path):
            return False
        Logger.info ('loading game data')

    def save_state(self):
         Logger.info ('saved game data')

class Instructions(BoxLayout):
    m_scrollview = ObjectProperty()
    def __init__(self):
        super().__init__()


class Menu(BoxLayout):
    selection = NumericProperty(-1)
    prev_game = BooleanProperty()
    next_game = BooleanProperty()
    def __init__(self):
        super().__init__()
        self.size_hint=(1,1)

    def ui_update(self, scorebar, *args):
        self.prev_game = scorebar.game_id>1
        self.next_game = scorebar.hi_score > scorebar.target[0] or scorebar.played>10

    def on_touch_down(self, touch):
        if self.collide_point(*touch.pos):
            return True
        return False

    def on_touch_up(self, touch):
        if self.collide_point(*touch.pos):
            for c in self.children:
                if c.collide_point(*touch.pos) and c.active:
                    self.selection = c.value
#                    sounds.MENU.play()
                    return True
            return True
        return False

class ScoreBar(BoxLayout):
    score = NumericProperty()
    hi_score = NumericProperty()
    game_id = NumericProperty(-1)
    played = NumericProperty()

    def __init__(self,**kwargs):
        super().__init__(**kwargs)
        try:
            self.store = JsonStore(os.path.join(get_user_path(),'scores.json'))
        except:
            self.store = None
        self.bind(game_id = self.set_game_id)
        self.bind(score = self.score_changed)
        self.bind(played = self.set_played)

    def get_status(self):
        try:
            if self.store.exists('status'):
                data = self.store.get('status')
                self.game_id = data['game_id']
            else:
                self.game_id = 1
        except:
            self.game_id = 1

    def set_played(self, *args):
        try:
            self.store.put(str(self.game_id), high_score=int(self.hi_score), played = int(self.played))
        except:
            pass
        Logger.info("played game %i %i times"%(self.game_id, self.played))

    def set_game_id(self, *args):
        Logger.info("setting game %i"%self.game_id)
        if self.game_id > 0:
            try:
                data = self.store.put('status', game_id = self.game_id)
            except:
                pass
        try:
            if self.store.exists(str(self.game_id)):
                data = self.store.get(str(self.game_id))
                self.hi_score = data['high_score']
                self.played = data['played']
            else:
                raise IOError
        except:
            self.hi_score = 0
            self.played = 0
        Logger.info("high score %i"%self.hi_score)
        self.score = 0
        random.seed(self.game_id)

    def score_changed(self, *args):
        Logger.info("setting game score %i for game %i"%(self.score,self.game_id))
        if self.score > self.hi_score:
            self.hi_score = self.score
            try:
                self.store.put(str(self.game_id), high_score=int(self.hi_score), played = int(self.played))
            except:
                pass

class StatusBar(BoxLayout):
    w_word_label = ObjectProperty()
    word = StringProperty()
    word_score = NumericProperty()
    def __init__(self,**kwargs):
        super().__init__(**kwargs)

class MessageBar(BoxLayout):
    message = StringProperty()
    def __init__(self,**kwargs):
        super().__init__(**kwargs)

    def game_changed(self, scorebar, game_id):
        self.game_id = game_id


class SneakyApp(App):
    colors = DictProperty()
    def build(self):
        try:
#            self.colors = colors.load_theme('default')
            self.colors = colors.load_theme(self.config.get('theme','theme'))
        except KeyError:
            self.colors = colors.load_theme('default')


        Builder.load_file('main.kv')
        Builder.load_file('cards.kv')
        self.pa = PlayArea()
        Window.bind(on_keyboard = self.on_keyboard)

        return self.pa

    def set_next_theme(self):
        themes = list(colors.themes)
        ind = themes.index(self.config.get('theme','theme'))
        new_theme = themes[ind-1]
        self.config.set('theme', 'theme', new_theme)
        self.config.write()
        self.colors = colors.load_theme(themes[ind-1])
        self.pa.draw_background()

    def build_config(self, config):
        config.setdefaults('theme', {'theme': 'beach'})

    def open_settings(self, *args):
        pass


    def on_keyboard(self, window, key, scancode=None, codepoint=None, modifier=None):
        '''
        used to manage the effect of the escape key
        '''
        if key == 27:
#            sounds.MENU.play()
            if self.pa.instructions in self.pa.children:
                self.pa.remove_widget(self.pa.instructions)
            elif self.pa.menu not in self.pa.children:
                self.pa.show_menu()
            else:
                self.pa.hide_menu()
            return True
        return False

    def on_pause(self):
        '''
        trap on_pause to keep the app alive on android
        '''
        self.pa.save_state()
        return True

    def on_resume(self):
        pass

    def on_stop(self):
        self.pa.save_state()

if __name__ == '__main__':
    gameapp = SneakyApp()
    gameapp.run()

