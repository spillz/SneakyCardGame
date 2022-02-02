from ast import Num
import random
import os
import math
#import sounds

#os.environ['KIVY_GL_DEBUG'] = '1'
#os.environ['KIVY_GL_BACKEND'] = 'angle_sdl2'


import kivy
from kivy.uix.label import Label
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
from kivy.graphics import Rectangle, Color, Line
from kivy.clock import Clock
from kivy.core.window import Window
from kivy.lang import Builder
from kivy.vector import Vector
from kivy.animation import Animation
from kivy.logger import Logger
from kivy.storage.jsonstore import JsonStore
from kivy.graphics import Rectangle, Color, Mesh, Line, Ellipse

#from kivy.utils import platform

import cards
import colors


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

class TurnState:
    #ENEMY TURN
    #PLAYER TURN
    #DRAW CARDS
    #SELECT STANCE
    #PLAY CARDS
    #END TURN (BY TOUCHING EVENT DECK)
    pass

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
           self._touch_down = False
           return True
       self._touch_down = False
#    def on_cards(self,*args):

#class CardSplay0(RelativeLayout):
#    pass

class CardSplay(FloatLayout):
    cards = ListProperty()
    orientation = StringProperty('horizontal')
    can_draw = BooleanProperty(False)
    shown_card = ObjectProperty(None, allownone=True)
    shown_card_shift = 0 #proportion of card width or heigh to shift when card is selected
    selected = BooleanProperty(False)
    multi_select = BooleanProperty(False)

    def __init__(self, **kwargs):
        if 'card_spread_scale' in kwargs:
            self.card_spread_scale = kwargs['card_spread_scale']
            del kwargs['card_spread_scale']
        else:
            self.card_spread_scale = 0.5
        super().__init__(**kwargs)
        self.touch_card = None
        self._clockev = None
        self._splay_clockev = None

    def on_cards(self,*args):
        for c in self.children[:]:
            if isinstance(c, cards.Card):
                self.remove_widget(c)
                c.selected=False
        for c in self.cards:
            self.add_widget(c)
            c.selected=False
        self.shown_card = None
        self.splay_cards()

    def on_size(self, *args):
        self.splay_cards()

    def splay_cards(self):
        if self._splay_clockev is not None:
            self._splay_clockev.cancel()
        self._splay_clockev = Clock.schedule_once(partial(self.do_splay_cards), 0.05)

    def do_splay_cards(self, time):
        self._splay_clockev = None
        if len(self.cards)==0:
            return
        cardw = self.parent.card_size[0]
        cardh = self.parent.card_size[1]
        mul = 1 if self.shown_card is None or self.shown_card==self.cards[-1] or len(self.cards)<=1 else 2
        if self.orientation=='horizontal':
            exp_len = cardw
            offset = 0
            if len(self.cards)>1:
                delta = int(max(min(cardw*self.card_spread_scale, (self.width-cardw*mul)/(len(self.cards)+1-mul)),2))
            else:
                delta = 0
            if delta==2:
                max_splay = (self.width-cardw)//2
            else:
                max_splay = len(self.cards)
        else:
            exp_len = -cardh
            offset = self.height-cardh
            if len(self.cards)>1:
                delta = -int(max(min(cardh*self.card_spread_scale, (self.height-cardh*mul)/(len(self.cards)-mul)),2))
            else:
                delta = 0
            if delta==-2:
                max_splay = (self.height-cardh)//2
            else:
                max_splay = len(self.cards)
        i=0
        for c in self.cards:
            if self.orientation=='horizontal':
                x = self.x + offset
                y = self.y if c!=self.shown_card else self.y+self.shown_card_shift*cardh
            else:
                y = self.y + offset
                x = self.x if c!=self.shown_card else self.x+self.shown_card_shift*cardw
            if len(self.cards)<10:
                anim = Animation(pos=c.pos, duration=i*0.025)+Animation(pos=(x,y), duration=0.2)
            else:
                anim = Animation(pos=(x,y), duration=0.2)
#            anim = Animation(pos=(x,y), duration=0.2)
            anim.start(c)
            #TODO: We could add a blocker to prevent touches but probably not necessary
            if c == self.shown_card:
                offset+=exp_len
            elif i<max_splay:
                offset+=delta
            i+=1
        print('Animation',self)

    def on_shown_card(self, exp, card):
        if not self.multi_select:
            for c in self.cards:
                c.selected = False
        if self.shown_card is not None:
            self.shown_card.selected = True
        if self.shown_card is None and self.multi_select:
            for c in self.cards:
                c.selected = False
        self.splay_cards()

    def do_closeup(self, closeup_card, time):
        self.parent.add_widget(CardSplayCloseup(closeup_card))

    def on_touch_down(self, touch):
        for c in self.cards[::-1]:
            if c.collide_point(*self.to_local(*touch.pos)):
                self._clockev = Clock.schedule_once(partial(self.do_closeup,c), 0.5)
                break

    def on_touch_up(self, touch):
        if not self.collide_point(*touch.pos):
            return
        if self._clockev != None:
            self._clockev.cancel()
            self._clockev = None
            return True
        if len(self.cards)>0:
            c = self.cards[-1]
            if c.collide_point(*self.to_local(*touch.pos)):
                self.touch_card = c

    def move_to(self, cards, deck, pos=None):
        self.cards = [c for c in self.cards if c not in cards]
        if pos is not None:
            deck.cards = deck.cards[:pos] + cards + deck.cards[pos:]
        else:
            deck.cards = deck.cards[:] + cards

    def __draw_frame(self, *args):
        self.canvas.after.clear()
        with self.canvas.after:
            Color(rgba=(1,1,1,1))
            Line(width=1, rectangle=(self.x, self.y, self.width, self.height) )
            if self.can_draw:
                Color(rgba=(240,69,0,1))
                Line(width=1+self.width//30, points=(self.x+self.width//10, self.y, self.x, self.y, self.x, self.y+self.width//10))
                Line(width=1+self.width//30, points=(self.right-self.width//10, self.y, self.right, self.y, self.right, self.y+self.width//10))
                Line(width=1+self.width//30, points=(self.x+self.width//10, self.top, self.x, self.top, self.x, self.top-self.width//10))
                Line(width=1+self.width//30, points=(self.right-self.width//10, self.top, self.right, self.top, self.right, self.top-self.width//10))


class PlayerDiscard(CardSplay):
    def on_cards(self, *args):
        super().on_cards(*args)
        for c in self.cards:
            c.face_up = True


class PlayerDeck(CardSplay):
    def on_cards(self, *args):
        super().on_cards(*args)
        for c in self.cards:
            c.face_up = False

    def draw_hand(self):
        if len(self.parent.hand.cards)==0:
            cards_to_draw = self.parent.hand.hand_size
        else:
            cards_to_draw = 1 + self.parent.hand.hand_size - len(self.parent.hand.cards)
        self.draw(cards_to_draw)
        self.parent.hand.can_draw=True
        self.parent.playerstance.can_draw=True
        self.parent.eventdeck.can_draw=True
        self.can_draw = False

    def draw(self, n):
        shuffle = n - len(self.cards)
        cards = self.cards[-1:-n-1:-1]
        self.move_to(cards,self.parent.hand)
        if shuffle>0:
            discards = self.parent.playerdiscard.cards[:]
            random.shuffle(discards)
            self.parent.playerdiscard.move_to(discards, self)
            cards = self.cards[-1:-shuffle-1:-1]
            self.move_to(cards, self.parent.hand)


class PlayerStance(CardSplay):
    active_card = ObjectProperty(None, allownone=True)

    def on_touch_up(self,touch):
        super().on_touch_up(touch)
        if not self.collide_point(*touch.pos):
            return False
        if not self.can_draw:
            return False
        if len(self.cards)==0:
            return False
        c = self.cards[-1]
        self.cards.remove(c)
        self.cards.insert(0,c)
        self.active_card = self.cards[-1]

    def on_cards(self, *args):
        for c in self.cards:
            c.face_up = True
            c.selected = False
        super().on_cards(*args)
        if len(self.cards)>0:
            self.active_card = self.cards[-1]
        else:
            self.active_card = None


class ActiveCardSplay(CardSplay):
    active_card = ObjectProperty(None, allownone=True)

    def on_cards(self, *args):
        super().on_cards(*args)
        if len(self.cards)>0:
            self.active_card = self.cards[-1]
        else:
            self.active_card = None

    def on_touch_down(self, touch):
        if self.collide_point(*touch.pos):
            touch.grab(self)
            return True

    def on_touch_up(self, touch):
        if touch.grab_current==self:
            touch.ungrab(self)
            if len(self.cards)>0:
                self.parent.hand.cancel_action()
            return True

    def discard_used(self, unused=0):
        if unused<len(self.cards):
            self.parent.playerstance.can_draw = False
        if unused>0:
            cards = self.cards[:unused]
            self.move_to(cards, self.parent.hand)
        cards = self.cards[:]
        self.move_to(cards, self.parent.playerdiscard)
        self.parent.hand.clear_selection()


class ActionSelectorOption(Label):
    _touching = BooleanProperty(False)

    def on_touch_down(self, touch):
        if self.collide_point(*touch.pos):
            self._touching=True

    def on_touch_up(self, touch):
        if self.collide_point(*touch.pos) and self._touching:
            self.parent.hand.selected_action = self.text
            self._touching=False
            return True


class ActionSelector(BoxLayout):
    def __init__(self, hand, actions, **kwargs):
        self.hand = hand
        super().__init__(orientation='vertical',**kwargs)
        for a in actions:
            self.add_widget(ActionSelectorOption(text=a))


class Hand(CardSplay):
    selected_action = StringProperty('')
    actions = DictProperty()
    action_selector = ObjectProperty(None, allownone=True)
    hand_size = NumericProperty(5)

    def on_selected_action(self, *args):
        if self.selected_action!='':
            self.move_to([self.shown_card], self.parent.activecardsplay)
            action = self.selected_action
            action_fn = self.actions[action]
            action_fn('card_action_selected')
            self.clear_card_actions()

    def clear_card_actions(self):
        if self.action_selector is not None:
            self.parent.remove_widget(self.action_selector)
            self.action_selector = None

    def show_card_actions(self, card, actions):
        self.clear_card_actions()
        assert(card==self.shown_card)
        pos = card.pos
        sz = card.size
        pos = pos[0],pos[1]+sz[1]
        sz = 2*sz[0], len(actions)*sz[1]//5
        self.selected_action = ''
        self.actions = actions
        self.action_selector = ActionSelector(self, actions, pos=pos, size=sz, size_hint=(None, None))
        self.parent.add_widget(self.action_selector) #TODO: This neeeds to handle resize

    def cancel_action(self):
        action = self.selected_action
        action_fn = self.actions[action]
        action_fn('card_action_end')
        self.selected_action = ''
        self.clear_selection()

    def on_touch_up(self,touch):
        super().on_touch_up(touch)
        if len(self.cards)==0:
            return False
        for c in self.cards[::-1]:
            if c.collide_point(*self.to_local(*touch.pos)):
                if self.shown_card==c: #deselect the already selected card
                    self.clear_selection()
                    self.shown_card = None
                elif self.selected_action!='': #stack it
                    action_fn = self.actions[self.selected_action]
                    if action_fn('can_stack', stacked_card=c):
                        self.move_to([c], self.parent.activecardsplay,0)
                        action_fn('card_stacked', stacked_card=c)
                        return False
                else: #select it
                    self.clear_selection()
                    self.shown_card = c
                    self.selected_action = ''
                    self.parent.board.map_choices = []
                    actions = c.get_actions(self.parent)
                    actions.update(self.parent.playerstance.cards[-1].get_actions_for_card(c, self.parent))
                    self.show_card_actions(c, actions)
                    self.parent.playerprompt.text = 'Select an action for this card'
                    return False
                break
        return False

    def clear_selection(self):
        self.parent.playerprompt.text = 'Select a card to play or touch the event deck to end your turn'
        self.parent.board.map_choices = []
        for c in [c for c in self.cards if c.selected]:
            c.selected = False
        self.clear_card_actions()
        self.selected_action=''

    def allow_stance_select(self):
        self.parent.playerstance.can_draw=True

    def on_cards(self, *args):
        for c in self.cards:
            c.face_up = True
        super().on_cards(*args)
        if len(self.cards)==0:
            self.can_draw=False
            self.parent.playerprompt.text = 'Touch the event deck to end your turn'
        else:
            self.parent.playerprompt.text = 'Select a card from your hand to play'


class LootDeck(CardSplay):
    def on_touch_up(self,touch):
        super().on_touch_up(touch)

    def select_draw(self, num_to_pick, num_offered):
        #TODO: This is a placeholder that just gives the top card
        #Instead we should pop up a card select that lets the player
        #choose num_to_pick from num_offered cards. Player can turn
        #down some or all of the offer
        card = self.cards[-1]
        self.move_to([card], self.parent.hand)


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
    can_draw = BooleanProperty(False)
    def on_touch_up(self,touch):
        super().on_touch_up(touch)
        if not self.collide_point(*touch.pos):
            return False
        if not self.can_draw:
            return False
        if len(self.cards)==0:
            return False
        card= self.cards[-1]
        card.face_up = True
        self.move_to([card], self.parent.eventdiscard)
        card.activate(self.parent.board)
        self.parent.playerdeck.draw_hand()
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

def extract_kwarg(kwargs,name,default=None):
    if name in kwargs:
        ret = kwargs[name]
        del kwargs[name]
    else:
        ret = default
    return ret


class Token(BoxLayout):
    map_pos = ListProperty()
    off = ListProperty()

    def __init__(self, **kwargs):
        map_pos = extract_kwarg(kwargs,'map_pos',(0,0))
        super().__init__(**kwargs)
        self._old_map_pos = map_pos
        self.map_pos = map_pos
        self._a = None
        self.pos = (self.map_pos[0]+self.off[0])*self.size[0], (self.map_pos[1]+self.off[1])*self.size[1]
        self.bind(map_pos=self.func_on_map_pos)
        self.bind(off=self.func_on_off)

    def func_on_map_pos(self, obj, mp):
        pos = (self.map_pos[0]+self.off[0])*self.size[0], (self.map_pos[1]+self.off[1])*self.size[1]
        dur = 0.1*(cards.dist(self._old_map_pos, self.map_pos))
        self._old_map_pos = self.map_pos
        self._a = Animation(pos=pos, duration=dur)
        self._a.bind(on_complete=self.anim_done)
        self._a.start(self)

    def func_on_off(self, obj, off):
        self.func_on_map_pos(obj, off)

    def anim_done(self, obj, val):
        self._a = None
        self.pos = (self.map_pos[0]+self.off[0])*self.size[0], (self.map_pos[1]+self.off[1])*self.size[1]

    def on_size(self, obj, sz):
        if self._a is not None:
            self._a.cancel()
        self.pos = (self.map_pos[0]+self.off[0])*self.size[0], (self.map_pos[1]+self.off[1])*self.size[1]
        self.draw_token()

    def on_parent(self, *args):
        self.draw_token()

    def on_pos(self, *args):
        self.draw_token()

    def on_off(self, *args):
        self.draw_token()

    def draw_token(self):
        return

class PlayerToken(Token):
    pass


class TargetToken(Token):
    #These should probably be properties so that they can be modified
    lock_level = 1
    loot_level = 1
    can_loot = True

    def draw_token(self):
        self.canvas.after.clear()
        with self.canvas.after:
            Color(0.1,0.3,0.8,1)
            x = self.x + self.width//5
            y = self.y + self.height//5
            w, h = 3*self.size[0]//5//2*2, 3*self.size[1]//5//2*2
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


class GuardToken(Token):
    state = StringProperty()

    def on_state(self, *args):
        self.draw_token()

    def draw_token(self):
        self.canvas.after.clear()
        with self.canvas.after:
            if self.state in ['dozing','alert']:
                Color(rgb=(0.75,0,0))
            else:
                Color(rgb=(0.5,0.1,0.1))
            Ellipse(pos=(self.x+(self.width)//10,self.y+(self.height)//10), size=(self.width*4//5, self.height*4//5))
            if self.state=='alert':
                Color(rgb=(0.4,0,0))
            else:
                Color(rgb=(0,0,0))
            if self.state in ['dozing','alert']:
                Ellipse(pos=(self.x+(self.width)//3-self.width*3//40,self.y+(self.height)*2//5-self.height*3//40),
                        size=(self.width*3//10, self.height*3//10),
                        angle_start=(270 if self.state=='dozing' else 290),
                        angle_end=(450 if self.state=='dozing' else 470))
                Ellipse(pos=(self.x+(self.width)*2//3-self.width*3//40,self.y+(self.height)*2//5-self.height*3//40),
                        size=(self.width*3//10, self.height*3//10),
                        angle_start=(270 if self.state=='dozing' else 250),
                        angle_end=(450 if self.state=='dozing' else 430))
            elif self.state =='dead':
                eyeleft = self.x+(self.width)//3-self.width*3//40
                eyeright = self.x+(self.width)//3+self.width*3//40
                eyetop = self.y+(self.height)//2 - self.height*3//40
                eyebottom = self.y+(self.height)//2 + self.height*3//40
                Line(points=(eyeleft,eyebottom,eyeright,eyetop))
                Line(points=(eyeleft,eyetop,eyeright,eyebottom))
                eyeleft = self.x+(self.width)*2//3-self.width*3//40
                eyeright = self.x+(self.width)*2//3+self.width*3//40
                eyetop = self.y+(self.height)//2 - self.height*3//40
                eyebottom = self.y+(self.height)//2 + self.height*3//40
                Line(points=(eyeleft,eyebottom,eyeright,eyetop))
                Line(points=(eyeleft,eyetop,eyeright,eyebottom))
            else: #KO'd
                eyeleft = self.x+(self.width)//3-self.width*3//40
                eyeright = self.x+(self.width)//3+self.width*3//40
                eyemiddle = self.y+(self.height)//2
                Line(points=(eyeleft,eyemiddle,eyeright,eyemiddle))
                eyeleft = self.x+(self.width)*2//3-self.width*3//40
                eyeright = self.x+(self.width)*2//3+self.width*3//40
                eyemiddle = self.y+(self.height)//2
                Line(points=(eyeleft,eyemiddle,eyeright,eyemiddle))

            Color(rgb=(0,0,0))
            if self.state=='dead':
                Ellipse(pos = (self.x+(self.width)*2//5,self.y+(self.height)//4), size = (self.width//5,self.height//5))
            else:
                Line(width=1+self.height//30, points=(self.x+(self.width)*2//5,self.y+(self.height)//3,self.x+(self.width)*3//5,self.y+(self.height)//3))


class TokenMapChoice(BoxLayout):
    def __init__(self, **kwargs):
        self.token = extract_kwarg(kwargs,'token',(0,0))
        self.choice_type = extract_kwarg(kwargs,'choice_type','info')
        self.listener = extract_kwarg(kwargs,'listener')
        super().__init__(**kwargs)

    def on_touch_down(self, touch):
        if self.collide_point(*touch.pos):
            touch.grab(self)
            return True

    def on_touch_up(self, touch):
        if touch.grab_current==self:
            touch.ungrab(self)
            self.listener('map_choice_selected', touch_object=self)
            return True


class MapChoice(BoxLayout):
    def __init__(self, **kwargs):
        map_pos = extract_kwarg(kwargs,'map_pos',(0,0))
        tp = extract_kwarg(kwargs,'choice_type','info')
        listener = extract_kwarg(kwargs,'listener')
        super().__init__(**kwargs)
        self.map_pos = map_pos
        self.choice_type = tp
        self.listener = listener

    def on_touch_down(self, touch):
        if self.collide_point(*touch.pos):
            touch.grab(self)
            return True

    def on_touch_up(self, touch):
        if touch.grab_current==self:
            touch.ungrab(self)
            if self.choice_type=='touch':
                self.listener('map_choice_selected', touch_object=self)
            return True


class Board(RelativeLayout):
    tokens = ListProperty()
    map_choices = ListProperty()
    space_size = ListProperty()
    w = NumericProperty()
    h = NumericProperty()
    token_types = {'G': GuardToken, 'P': PlayerToken, 'T': TargetToken}

    def on_tokens(self, *args):
        self.active_player_token = None
        for t in self.children[:]:
            if isinstance(t,Token):
                t.unbind(map_pos=self.on_token_move)
                self.remove_widget(t)
        for t in self.tokens:
            if isinstance(t,Token):
                t.bind(map_pos=self.on_token_move)
                self.add_widget(t)
                t.size = self.space_size
            if isinstance(t,PlayerToken):
                self.active_player_token = t

    def on_map_choices(self, *args):
        for t in self.children[:]:
            if isinstance(t,MapChoice) or isinstance(t,TokenMapChoice):
                self.remove_widget(t)
        for t in self.map_choices:
            if isinstance(t,MapChoice) or isinstance(t,TokenMapChoice):
                self.add_widget(t)
                t.size = self.space_size

    def on_space_size(self, *args):
        for t in self.tokens:
            t.size = self.space_size
        for c in self.map_choices:
            c.size = self.space_size

    def on_token_move(self, token, mp):
        for t in self.tokens:
            if isinstance(t,GuardToken) and t.map_pos != self.active_player_token.map_pos and t.state not in ['dead','unconscious']:
                if 1<=self.dist(t.map_pos, self.active_player_token.map_pos)<=10 and self[self.active_player_token.map_pos] not in ['U','B']:
                    if not self.has_types_between(t.map_pos, self.active_player_token.map_pos, 'B'):
                        t.map_pos = self.active_player_token.map_pos
                        if t.state == 'dozing':
                            t.state = 'alert'
                        return

        clashes = {}
        for t0 in self.tokens:
            for t1 in self.tokens:
                if t0==t1:
                    continue
                if tuple(t0.map_pos) == tuple(t1.map_pos):
                    p = tuple(t0.map_pos)
                    if p in clashes:
                        clashes[p].add(t0)
                        clashes[p].add(t1)
                    else:
                        clashes[p] = set([t0,t1])

        for t in self.tokens:
            if tuple(t.map_pos) not in clashes:
                t.off = [0,0]
        for p in clashes:
            for t,o in zip(clashes[p],[[-0.25,-0.25],[0.25,0.25],[-0.25,0.25],[0.25,-0.25]][:len(clashes[p])]):
                t.off = o


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

    def iter_tokens(self, token_type = None):
        if token_type is None:
            for t in self.tokens:
                yield t
        else:
            for t in self.tokens:
                if isinstance(t, self.token_types[token_type]):
                    yield t

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

    def make_choice(self, map_pos, listener, choice_type):
        return MapChoice(map_pos=map_pos, listener=listener, choice_type=choice_type)

    def make_token_choice(self, token, listener, choice_type):
        return TokenMapChoice(token=token, listener=listener, choice_type=choice_type)

    def iter_spawns(self):
        for c in self.map.cards:
            for s in c.spawns:
                yield self.get_pos_from_card(c,s)

    def iter_waypoints(self):
        for c in self.map.cards:
            for w in c.spawns+c.waypoints:
                yield self.get_pos_from_card(c,w)

    def iter_targets(self):
        for c in self.map.cards:
            for t in c.targets:
                yield self.get_pos_from_card(c,t)

    def nearest_guard(self, map_pos, max_range=None, states = ['dozing', 'alert']):
        gts = [t for t in self.tokens if isinstance(t,GuardToken) and t.state in states]
        dists = [self.dist(map_pos,t.map_pos) for t in gts]
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

    def guard_nearest_move(self, guard_pos, player_pos, include_player=True, max_dist=1000):
        g_to_p_dist = self.dist(player_pos, guard_pos)
        wps = [wp for wp in self.iter_waypoints()]
        candidates = []
        smallest_dist = max_dist
        for wp in wps:
            p_to_wp_dist = self.dist(wp, player_pos)
            g_to_wp_dist = self.dist(wp, guard_pos)
            if (p_to_wp_dist<g_to_p_dist or not include_player) and p_to_wp_dist<=smallest_dist: #g_to_wp_dist<g_to_p_dist and
                smallest_dist = p_to_wp_dist
                candidates.append(wp)
        if include_player and len(candidates)==0:
            return player_pos
        elif len(candidates)==0:
            return guard_pos
        else:
            return candidates[-1]

    def walkable_dist(self, map_pos1, map_pos2):
        pass

    def dist(self, map_pos1, map_pos2):
        return ((map_pos1[0]-map_pos2[0])**2 + (map_pos1[1]-map_pos2[1])**2)**0.5

    def walkable_spots(self, map_pos, dist, spots):
        if len(spots)==0:
            spots[tuple(map_pos)] = 0
        if self[map_pos] in ['U','L','L0','L1','L2']:
            walk_costs = {'U': 1, 'L': 1, 'L0': 1, 'L1': 1, 'L2': 1}
        elif self[map_pos] == 'B':
            walk_costs = {'B': 1,'U': 1, 'L': 1, 'L0': 1, 'L1': 1, 'L2': 1}
        for pos in self.iter_in_range(map_pos,1.5):
            if self[pos] in walk_costs:
                cur_dist = spots[tuple(map_pos)]+walk_costs[self[pos]]*self.dist(pos,map_pos)
                if tuple(pos) in spots and cur_dist>=spots[pos]:
                    continue
                if cur_dist <= dist:
                    spots[tuple(pos)] = cur_dist
                    self.walkable_spots(pos, dist, spots)
        return spots


class PlayArea(FloatLayout):
    def __init__(self,**kwargs):
        super().__init__(**kwargs)
        self.menu = Menu()
        self.instructions = None
        self.menu.bind(selection = self.menu_choice)
        self.first_start = True
        self.action_selector = None

    def on_parent(self, *args):
        self.mapcards = cards.make_map_cards(self, self.map_card_grid_size[0], self.map_card_grid_size[1], self.map_size[0]*self.map_size[1])
        self.playercards = cards.make_player_cards(self)
        self.stancecards = cards.make_stance_cards(self)
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

        self.map.cards[:] = self.mapcards #[:self.map.rows*self.map.cols]

        self.playerdeck.cards[:] = self.playercards[:]
        self.playerdiscard.cards[:] = []
        self.playerstance.cards[:] = reversed(self.stancecards[:])

        self.loot1.cards[:] = self.lootcards[0][:]
        self.loot2.cards[:] = self.lootcards[1][:]
        self.loot3.cards[:] = self.lootcards[2][:]

        self.exhausted.cards[:] = []

        self.marketdeck.cards[:] = self.marketcards[4:]
        self.marketoffer.cards[:] = self.marketcards[:4]

        self.eventdeck.cards[:] = self.eventcards[:]
        self.eventdiscard.cards[:] = []

        self.eventdeck.can_draw = True

    def token_setup(self):
        player = PlayerToken()
        spawns = []
        for c in self.map.cards:
            spawns += [self.board.get_pos_from_card(c,s) for s in c.spawns]
        guards = [GuardToken(map_pos=s) for s in spawns]
        loot = []
        for c in self.map.cards:
            loot += [self.board.get_pos_from_card(c,s) for s in c.targets]
        targets = [TargetToken(map_pos=s) for s in loot]
        self.board.tokens = [player]+guards+targets

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

