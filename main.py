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
from kivy.uix.scrollview import ScrollView
from kivy.uix.modalview import ModalView
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

class ButLabel(Label):
    pressed = BooleanProperty(False)
    touching = BooleanProperty(False)
    def on_touch_down(self, touch):
        if self.collide_point(*touch.pos):
            touch.grab(self)
            self.touching = True
            return True

    def on_touch_up(self, touch):
        if touch.grab_current==self:
            touch.ungrab(self)
            if self.collide_point(*touch.pos):
                self.pressed = True
            self.touching = False
            return True


class CardSelector(BoxLayout):
    cards = ListProperty()
    num_to_pick = NumericProperty()
    but_ok_pressed = BooleanProperty()
    card_size = ListProperty()

    def on_cards(self, *args):
        for c in self.card_splay.children[:]:
            if isinstance(c, cards.Card):
                c.unbind(on_touch_up=self.on_touch_up_card)
                c.unbind(on_touch_down=self.on_touch_down_card)
                self.card_splay.remove_widget(c)
        for c in self.cards:
            self.card_splay.add_widget(c)
            c.bind(on_touch_up=self.on_touch_up_card)
            c.bind(on_touch_down=self.on_touch_down_card)
            c.size = self.card_size
            c.face_up = True

    def on_touch_down_card(self, card, touch):
        if card.collide_point(*touch.pos):
            touch.grab(card)
            return True

    def on_touch_up_card(self, card, touch):
        if touch.grab_current==card:
            touch.ungrab(card)
            if not card.collide_point(*touch.pos):
                return True
            if self.num_to_pick>1:
                sel = [c for c in self.cards if c.selected]
                if len(sel)>=self.num_to_pick:
                    return True
                card.selected = not card.selected
            elif self.num_to_pick==1:
                for c in self.cards:
                    if c==card:
                        c.selected = not c.selected
                    else:
                        c.selected = False
            return True

    def on_parent(self, *args):
        if self.parent is not None:
            self.card_size = self.parent.card_size
            self.parent.bind(card_size=self.setter('card_size'))

    def on_touch_down(self, touch):
        super().on_touch_down(touch)
        return True

    def on_touch_up(self, touch):
        super().on_touch_up(touch)
        return True


class CardSplayCloseup(ModalView):
    '''
    Inspect a closeup of an individual card or from a selection of cards
    '''
    #TODO
    cards = ListProperty()
    def __init__(self,closeup_card=None,cards=[],*args,**kwargs):
        super().__init__(*args, **kwargs)
        self.closeup_card = None
        if closeup_card is None:
            closeup_card = cards[0]
        self.size_hint = (0.8,0.8)
        self.content = RelativeLayout()
        self.add_widget(self.content)
        self.scroll_view = ScrollView(size_hint=(None,None))
        self.scroll_view.bind(on_touch_down=self.on_touch_down_sv)
        self.content.add_widget(self.scroll_view)
        self.grid_layout = GridLayout(cols=4, size_hint=(1,None), spacing=1, padding=1)
        self.grid_layout.bind(minimum_height=self.grid_layout.setter('height'))
        self.scroll_view.add_widget(self.grid_layout)
        self.cards = [type(c)() for c in cards]
        self.aspect = closeup_card.width/closeup_card.height
        for c,c0 in zip(self.cards,cards):
            c.height = c0.height
            c.width = c0.width
            c.face_up = True
            if c==closeup_card:
                c.selected = True
            c.bind(on_touch_up=self.on_touch_up_card)
            c.bind(on_touch_down=self.on_touch_down_card)
            self.grid_layout.add_widget(c)
        if closeup_card is not None:
            self.set_closeup(closeup_card)

    def set_closeup(self, closeup_card):
        if self.closeup_card is not None:
            self.content.remove_widget(self.closeup_card)
        if len(self.cards)>0:
            self.closeup_card = self.cards[0]
        self.closeup_card = type(closeup_card)()
        self.closeup_card.face_up=True
        self.content.add_widget(self.closeup_card)
        self.on_size()

    def on_size(self,*args):
        pref_width = int(self.height*self.aspect)
        pref_height = int(self.width/self.aspect)
        ratio = 1
        if pref_width<=self.width:
            if len(self.cards)>0 and pref_width>0.66*self.width:
                ratio = 0.66*self.width/pref_width
                pref_width = int(0.66*self.width)
            self.closeup_card.size = (pref_width,int(self.height*ratio))
            if len(self.cards) == 0:
                self.closeup_card.x = (self.width-pref_width)//2
                self.scroll_view.width = 1
                self.scroll_view.height = 1
                self.scroll_view.pos = (-10,-10)
            else:
                self.closeup_card.pos = (0,0)
                self.scroll_view.width = self.width-pref_width
                self.scroll_view.height = self.height
                self.scroll_view.pos = (self.closeup_card.width,0)
        else:
            if len(self.cards)>0 and pref_height>0.5*self.height:
                ratio = 0.5*self.height/pref_height
                pref_height= int(0.5*self.height)
            self.closeup_card.size = (self.width*ratio,pref_height)
            if len(self.cards) == 0:
                self.closeup_card.y = (self.height-pref_height)//2
                self.scroll_view.width = 1
                self.scroll_view.height = 1
                self.scroll_view.pos = (-10,-10)
            else:
                self.closeup_card.pos = (0,0)
                self.scroll_view.width = self.width
                self.scroll_view.height = self.height-pref_height
                self.scroll_view.pos = (0,self.closeup_card.height)
        if len(self.cards)>0:
            self.grid_layout.cols = int(self.scroll_view.width//self.cards[0].width)
        for c in self.cards:
            pass

    def on_touch_down_card(self, card, touch):
        if card.collide_point(*touch.pos):
            touch.grab(card)
            return True

    def on_touch_up_card(self, card, touch):
        if touch.grab_current==card:
            touch.ungrab(card)
            for c0 in self.cards:
                c0.selected=False
            card.selected=True
            self.set_closeup(card)
            return True

    def on_touch_down_sv(self, sv, touch):
        if not self.scroll_view.collide_point(*touch.pos):
            self.dismiss()
            return True


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
            c.size = self.parent.card_size
            c.selected=False
        self.shown_card = None
        self.splay_cards()

    def on_size(self, *args):
        self.splay_cards(anim=False)

    def splay_cards(self, anim=True):
        if self._splay_clockev is not None:
            self._splay_clockev.cancel()
        self._splay_clockev = Clock.schedule_once(partial(self.do_splay_cards, anim=anim), 0.05)

    def do_splay_cards(self, time, anim=True):
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
            if anim:
                if len(self.cards)<10:
                    animc = Animation(pos=c.pos, duration=i*0.025)+Animation(pos=(x,y), duration=0.2)
                else:
                    animc = Animation(pos=(x,y), duration=0.2)
    #            anim = Animation(pos=(x,y), duration=0.2)
                animc.start(c)
            else:
                c.x=x
                c.y=y
                #TODO: We could add a blocker to prevent touches but probably not necessary
            if c == self.shown_card:
                offset+=exp_len
            elif i<max_splay:
                offset+=delta
            i+=1

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

    def do_closeup(self, closeup_card, touch, time):
#        self.parent.add_widget(CardSplayCloseup(closeup_card))
        if not closeup_card.face_up:
            closeup_card = None
        CardSplayCloseup(closeup_card=closeup_card,cards=self.cards).open()
        self._clockev = None

    def on_touch_down(self, touch):
        for c in self.cards[::-1]:
            if c.collide_point(*self.to_local(*touch.pos)):
                touch.grab(self)
                self._clockev = Clock.schedule_once(partial(self.do_closeup, c, touch), 0.5)
                return True

    def on_touch_up(self, touch):
        if touch.grab_current!=self:
            return
        touch.ungrab(self)
        if self._clockev != None:
            self._clockev.cancel()
            self._clockev = None
            return True


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
        for c in self.children[:]:
            if isinstance(c, cards.Card):
                c.face_up=False
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
        self.parent.playertraits.can_draw=True
        self.parent.eventdeck.can_draw=True
        self.can_draw = False

        self.parent.board.scroll_to_player()


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


class PlayerTraits(CardSplay):
    active_card = ObjectProperty(None, allownone=True)

    def on_touch_up(self,touch):
        super().on_touch_up(touch)
        if not self.collide_point(*touch.pos):
            return False
        if not self.can_draw:
            return False
        if len(self.cards)==0:
            return False
        self.cards = [self.cards[-1]] + self.cards[:-1]
        return True

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

    def on_touch_up(self, touch):
        if super().on_touch_up(touch) is None:
            return
        if len(self.cards)>0:
            self.parent.hand.cancel_action()
        return True

    def discard_used(self, unused=0, noise=0, exhaust_on_use=None, tap_on_use=None):
        if unused>0:
            cards0 = self.cards[:unused]
            self.move_to(cards0, self.parent.hand)
        if len(self.cards)>0:
            if exhaust_on_use is not None:
                if isinstance(exhaust_on_use, cards.TraitCard):
                    self.parent.playertraits.move_to([exhaust_on_use], self.parent.exhausted)
                else:
                    self.move_to([exhaust_on_use], self.parent.exhausted)
            if tap_on_use is not None:
                if isinstance(tap_on_use, cards.TraitCard):
                    tap_on_use.tapped = True
        cards0 = self.cards[:]
        self.move_to(cards0, self.parent.playerdiscard)
        self.parent.hand.clear_selection()
#        self.parent.noisetracker.noise += noise


class ActionSelectorOption(Label):
    _touching = BooleanProperty(False)

    def on_touch_down(self, touch):
        if self.collide_point(*touch.pos):
            touch.grab(self)
            self._touching=True
            return True

    def on_touch_up(self, touch):
        if touch.grab_current==self:
            touch.ungrab(self)
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
        if self.selected_action!='':
            action = self.selected_action
            action_fn = self.actions[action]
            action_fn('card_action_end')
            self.selected_action = ''
            self.clear_selection()

    def on_touch_up(self,touch):
        if super().on_touch_up(touch) is None:
            return
        if len(self.cards)==0:
            return True
        if self.can_draw==False:
            return True
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
                        return True
                else: #select it
                    self.clear_selection()
                    self.shown_card = c
                    self.selected_action = ''
                    self.parent.board.map_choices = []
                    actions = c.get_actions(self.parent)
                    for tc in self.parent.playertraits.cards:
                        action_types = [type(a) for a in actions.values()]
                        trait_actions = tc.get_actions_for_card(c, self.parent) #Trait actions are available for all cards so we add the ones that aren't already available for this card
                        for ta in trait_actions:
                            if type(trait_actions[ta]) not in action_types:
                                actions.update({ta: trait_actions[ta]})
                    self.show_card_actions(c, actions)
                    self.parent.playerprompt.text = 'Select an action for this card'
                    return True
                break
        return True

    def clear_selection(self):
        self.parent.playerprompt.text = 'Select a card to play or touch the event deck to end your turn'
        self.parent.board.map_choices = []
        for c in [c for c in self.cards if c.selected]:
            c.selected = False
        self.clear_card_actions()
        self.selected_action=''

    def allow_stance_select(self):
        self.parent.playertraits.can_draw=True

    def on_cards(self, *args):
        for c in self.cards:
            c.face_up = True
        super().on_cards(*args)
        if len(self.cards)==0:
            self.parent.playerprompt.text = 'Touch the event deck to end your turn'
        else:
            self.parent.playerprompt.text = 'Select a card from your hand to play'


class SkillDeck(CardSplay):
    def on_touch_up(self,touch):
        super().on_touch_up(touch)

    def select_draw(self, num_to_pick=2, num_offered=4):
        #TODO: This is a placeholder that just gives the top card
        #Instead we should pop up a card select that lets the player
        #choose num_to_pick from num_offered cards. Player can turn
        #down some or all of the offer
        cards = self.cards[-num_offered:]
        if len(cards)==0:
            print('Warning: No skill cards available to pick')
            return
        for c in cards:
            self.cards.remove(c)
        self.parent.cardselector = CardSelector(num_to_pick=num_to_pick)
        self.parent.add_widget(self.parent.cardselector)
        self.parent.cardselector.bind(but_ok_pressed=self.card_picked)
        self.parent.cardselector.cards = cards

    def card_picked(self, cs, pressed):
        for c in cs.cards:
            cs.cards.remove(c)
            if not c.selected:
                c.face_up = False
                self.cards.insert(0,c)
            else:
                self.parent.hand.cards.append(c)
                c.face_up = True
                c.selected = False
        self.parent.remove_widget(cs)
        self.parent.cardselector = None


class LootDeck(CardSplay):
    def on_touch_up(self,touch):
        super().on_touch_up(touch)

    def select_draw(self, num_to_pick=1, num_offered=1):
        #TODO: This is a placeholder that just gives the top card
        #Instead we should pop up a card select that lets the player
        #choose num_to_pick from num_offered cards. Player can turn
        #down some or all of the offer
        cards = self.cards[-num_offered:]
        for c in cards:
            self.cards.remove(c)
        self.parent.cardselector = CardSelector(num_to_pick=num_to_pick)
        self.parent.add_widget(self.parent.cardselector)
        self.parent.cardselector.bind(but_ok_pressed=self.card_picked)
        self.parent.cardselector.cards = cards

    def card_picked(self, cs, pressed):
        for c in cs.cards:
            cs.cards.remove(c)
            if not c.selected:
                c.face_up = False
                self.cards.insert(0,c)
            else:
                self.parent.hand.cards.append(c)
                c.face_up = True
                c.selected = False
        self.parent.remove_widget(cs)
        self.parent.cardselector = None
        self.parent.stats.loot+=1
        self.parent.stats.t_loot+=1

class MarketDeck(CardSplay):
    def on_touch_up(self,touch):
        return super().on_touch_up(touch)

    def select_draw(self, num_to_pick=1, num_offered=1, coin=1):
        #TODO: Implement coin usage
        cards = self.cards[-num_offered:]
        self.cards = self.cards[:-num_offered]
        self.parent.cardselector = CardSelector(num_to_pick=num_to_pick)
        self.parent.add_widget(self.parent.cardselector)
        self.parent.cardselector.bind(but_ok_pressed=self.card_picked)
        self.parent.cardselector.cards = cards

    def card_picked(self, cs, pressed):
        cards = cs.cards[:]
        cs.cards = []
        for c in cards:
            if not c.selected:
                c.face_up = False
                self.cards.append(c) #unpurchased cards go back on top
            else:
                self.parent.hand.cards.append(c)
                c.face_up = True
                c.selected = False
        self.parent.remove_widget(cs)
        self.parent.cardselector = None



class Exhausted(CardSplay):
    def on_touch_up(self,touch):
        return super().on_touch_up(touch)

    def on_cards(self, *args):
        for c in self.children[:]:
            if isinstance(c, cards.Card):
                c.face_up=False
        super().on_cards(*args)
        for c in self.cards:
            c.face_up = True


class EventDeck(CardSplay):
    can_draw = BooleanProperty(False)
    def on_touch_up(self,touch):
        if super().on_touch_up(touch) is None:
            return
        if not self.collide_point(*touch.pos):
            return True
        return self.draw()

    def draw(self):
        if not self.can_draw:
            return True
        if len(self.cards)==0:
            return True
        if self.parent.clear_and_check_end_game():
            return True
        for t in self.parent.board.iter_tokens('G'):
            t.frozen=False
        card= self.cards[-1]
        card.face_up = True
        for c in self.parent.playertraits.cards:
            c.tapped = False
        self.move_to([card], self.parent.eventdiscard)
#        self.parent.noisetracker.apply_noise()
        card.activate(self.parent.board)
        self.parent.playerdeck.draw_hand()
        self.parent.stats.rounds+=1
        self.parent.stats.t_rounds+=1
        return True


class EventDiscard(CardSplay):
    def on_touch_up(self,touch):
        if super().on_touch_up(touch)==True:
            return True

    def on_cards(self, *args):
        for c in self.children[:]:
            if isinstance(c, cards.Card):
                c.face_up=False
        super().on_cards(*args)
        for c in self.cards:
            c.face_up = True


#class NoiseTracker(Label):
#    def reset(self):
#        self.noise = 0
#
#    def apply_noise(self):
#        board = self.parent.board
#        pp = board.active_player_token.map_pos
#        for t in board.iter_tokens('G'):
#            if board.dist(pp,t.map_pos)<=self.noise:
#                if t.state == 'alert' and board[pp] not in board.building_types:
#                    t.map_pos = pp
#                elif t.state == 'dozing':
#                    t.state = 'alert'
#        self.noise = 0


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
            c.size_hint = (1,1)
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
    has_loot = BooleanProperty(True)
    picked = BooleanProperty(False)

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


class MarketToken(Token):
    #These should probably be properties so that they can be modified
    lock_level = 1
    loot_level = 1

    def draw_token(self):
        self.canvas.after.clear()
        with self.canvas.after:
            Color(0.6,0.4,0,1)
            x = self.x + self.width//5
            y = self.y + self.height//5
            w, h = 3*self.size[0]//5//2*2, 3*self.size[1]//5//2*2
            Ellipse(pos=(x,y),size=(w,h))
            #Rectangle(pos = (x,y), size = (3*size[0]//5,3*size[1]//5))

    def on_touch_down(self, touch):
        if self.collide_point(*touch.pos):
            touch.grab(self)
            return True

    def on_touch_up(self, touch):
        if touch.grab_current==self:
            touch.ungrab(self)
            if self.collide_point(*touch.pos):
                self.parent.parent.parent.marketdeck.select_draw(0,4,0)
            return True


class GuardToken(Token):
    state = StringProperty()
    frozen = BooleanProperty(False)

    def on_state(self, *args):
        self.draw_token()
        if self.state!='dozing':
            stats=self.parent.parent.parent.stats
            if self.state=='dead':
                stats.kills+=1
                stats.t_kills+=1
            if self.state=='unconscious':
                stats.knockouts+=1
                stats.t_knockouts+=1
            if self.state=='alert' and self.parent.active_player_token.map_pos==self.map_pos:
                stats.contacts+=1
                stats.t_contacts+=1

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

class ObjectiveToken(TargetToken):
    has_loot = BooleanProperty(False)

    def on_picked(self, obj, value):
        if self.picked:
            pa = self.parent.parent.parent
            pa.level_complete()

    def draw_token(self):
        self.canvas.after.clear()
        with self.canvas.after:
            Color(0.8,0.8,0.0,1)
            x = self.x + self.width//5
            y = self.y + self.height//5
            w, h = 3*self.size[0]//5//2*2, 3*self.size[1]//5//2*2
            #Rectangle(pos = (x,y), size = (3*size[0]//5,3*size[1]//5))
            vertices1 = [x+w//2,y,0,0,
                         x,y+3*h//4,0,0,
                         x+w,y+3*h//4,0,0,
                         ]
            vertices2 = [x+w//2,y+h,0,0,
                         x,y+h//4,0,0,
                         x+w,y+h//4,0,0,
                         ]
            indices = [0,1,2]
            Mesh(vertices = vertices1,
                 indices = indices,
                 mode = 'triangle_fan'
                 )
            Mesh(vertices = vertices2,
                 indices = indices,
                 mode = 'triangle_fan'
                 )


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
            if self.choice_type in ['touch','visible']:
                self.listener('map_choice_selected', touch_object=self)
            return True


class Board(RelativeLayout):
    tokens = ListProperty()
    map_choices = ListProperty()
    space_size = ListProperty()
    w = NumericProperty()
    h = NumericProperty()
    token_types = {'G': GuardToken, 'P': PlayerToken, 'T': TargetToken, 'M': MarketToken}
    path_types = ['U','L','L0','L1','L2']
    building_types = ['B', 'B0']

    def on_tokens(self, *args):
        self.active_player_token = None
        for t in self.children[:]:
            if isinstance(t,Token):
                t.unbind(map_pos=self.on_token_move)
                if isinstance(t,GuardToken):
                    t.unbind(state=self.on_token_state)
                self.remove_widget(t)
        for t in self.tokens:
            if isinstance(t,Token):
                t.bind(map_pos=self.on_token_move)
                if isinstance(t,GuardToken):
                    t.bind(state=self.on_token_state)
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
        self.scroll_to_player()

    def scroll_to_player(self):
        pad = (
            (self.parent.width - self.active_player_token.width)//4,
            (self.parent.height - self.active_player_token.height)//4
        )
        self.parent.scroll_to(self.active_player_token,padding=pad)


    def on_space_size(self, *args):
        for t in self.tokens:
            t.size = self.space_size
        for c in self.map_choices:
            c.size = self.space_size

    def on_token_move(self, token, mp):
        self.token_update()

    def on_token_state(self, token, st):
        self.token_update()

    def token_update(self):
        p = self.active_player_token
        #Move guard to player if player is visible
        for t in self.iter_tokens('G'):
            if t.map_pos!=p.map_pos and t.state not in ['dead','unconscious'] and not t.frozen:
                if 1<=self.dist(t.map_pos, p.map_pos)<=10 and self[p.map_pos] not in ['U']+self.building_types:
                    if not self.has_types_between(t.map_pos, p.map_pos, self.building_types):
                        t.map_pos = p.map_pos
                        t.state = 'alert'
                        return
        #Move guard to a downed guard if visible
        for t in self.iter_tokens('G'):
            if t.map_pos==p.map_pos or t.state in ['unconscious','dead'] or t.frozen: continue
            closest = (100, None)
            for t0 in self.iter_tokens('G'):
                if t0.state in ['alert','dozing']: continue
                if t0.map_pos==p.map_pos: continue
                d = self.dist(t.map_pos, t0.map_pos)
                if 1<d<=10 and self[t0.map_pos] not in ['U']+self.building_types:
                    if not self.has_types_between(t.map_pos, t0.map_pos, self.building_types):
                        if d<closest[0]: closest = (d, t0)
                elif d==0:
                    if t.state!='alert':
                        t.state = 'alert'
                        return
            d,t0 = closest
            if t0 is not None and t.map_pos!=t0.map_pos and t.state!='alert':
                t.map_pos = t0.map_pos
                t.state = 'alert'
                return
        #A clash occurs if two or more tokens occupy the same space, we'll shift their positions a bit
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
        self.scroll_to_player()

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

    def iter_between(self, pos1, pos2,off1=(0,0),off2=(0,0)):
        '''
        simple line of site algorithm to yield all map positions on the line between pos1 and pos2
        '''
        x1,y1 = pos1
        x2,y2 = pos2
        ox1,oy1 = off1
        ox2,oy2 = off2
        x1a,y1a=x1+ox1,y1+oy1
        x2a,y2a=x2+ox2,y2+oy2
        if abs(y2-y1)==0 and abs(x2-x1)==0:
            return
        if abs(y2a-y1a)==0 and abs(x2a-x1a)==0:
            return
        if abs(y2a-y1a)>abs(x2a-x1a):
            slope = (x2a-x1a)/(y2a-y1a)
            if y1a>y2a:
                y1,y2 = y2,y1
                x1,x2 = x2,x1
                y1a,y2a = y2a,y1a
                x1a,x2a = x2a,x1a
            y=int(y1)
            while y<y2:
                yo = y+0.5
                xo = x1a + (yo-y1a)*slope
                x = int(xo)
                if xo-x<=0.5:
                    if 0<=x<self.w:
                        yield x,y
                        yield x,y+1
                if xo-x>=0.5:
                    if 0<=x+1<self.w:
                        yield x+1,y
                        yield x+1,y+1
                y+=1
        else:
            slope = (y2a-y1a)/(x2a-x1a)
            if x1a>x2a:
                y1,y2 = y2,y1
                x1,x2 = x2,x1
                x1a,x2a = x2a,x1a
                y1a,y2a = y2a,y1a
            x=int(x1)
            while x<x2:
                xo = x+0.5
                yo = y1a + (xo-x1a)*slope
                y = int(yo)
                if yo-y<=0.5+1e-4:
                    if 0<=y<self.h:
                        yield x,y
                        yield x+1,y
                if yo-y>=0.5-1e-4:
                    if 0<=y+1<self.h:
                        yield x,y+1
                        yield x+1,y+1
                x+=1

    def iter_types_between(self, pos1, pos2, types,off1=(0,0), off2=(0,0)):
        try:
            for pos in self.iter_between(pos1, pos2, off1, off2):
                if self[pos] in types:
                    yield pos
        except IndexError:
            import pdb
            pdb.set_trace()
            for pos in self.iter_between(pos1, pos2, off1, off2):
                print(pos, self[pos])

    def has_types_between(self, pos1, pos2, types):
        bases = [tuple(pos1),tuple(pos2)]
#        print('CHECKING',pos1, pos2, types, [p for p in self.iter_types_between(pos1, pos2, types)])
        for pos in self.iter_types_between(pos1, pos2, types):
            if pos in bases: continue
            return True
#        print('CLEAR',pos1, pos2, types, [p for p in self.iter_between(pos1, pos2)])
#        import pdb
#        pdb.set_trace()
#        [p for p in self.iter_between(pos1, pos2)]
        return False

    def has_line_of_sight(self, pos1, pos2, types):
        bases = [tuple(pos1),tuple(pos2)]
        e = 0.5
        for add1 in [(-e,-e),(-e,e),(e,-e),(e,e)]:
            for add2 in [(-e,-e),(-e,e),(e,-e),(e,e)]:
                blockers = [p for p in self.iter_types_between(pos1, pos2, types, add1, add2) if p not in bases]
                if len(blockers)==0:
#                    tmp = [p for p in self.iter_between(pos1, pos2, add1, add2)]
#                    print('CLEAR',pos1, pos2, add1, add2, types, tmp)
#                    if len(tmp)==0:
#                        import pdb
#                        pdb.set_trace()
#                        [p for p in self.iter_between(pos1, pos2, add1, add2)]
#                    blockers = [p for p in self.iter_types_between(pos1, pos2, types, add1, add2) if p not in bases]
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
                if max(abs(xoff),abs(yoff))+0.5*min(abs(xoff),abs(yoff))<=radius:
#                if xoff*xoff+yoff*yoff<=radius*radius:
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

    def active_player_clashing(self):
        return sum([g.map_pos==self.active_player_token.map_pos and g.state in ['alert','dozing'] and g.frozen==False for g in self.iter_tokens('G')])

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

    def iter_markets(self):
        for c in self.map.cards:
            for m in c.markets:
                yield self.get_pos_from_card(c,m)

    def iter_lights(self):
        for c in self.map.cards:
            for l in c.lights:
                yield self.get_pos_from_card(c,l)

    def hide_light(self, pos, permanent=False):
        c,p = self.get_card_and_pos(pos)
        if p not in c.lights:
            return False
        ind = c.lights.index(p)
        lights = c.lights[:ind]+c.lights[ind+1:]
        c.light_map(lights)
        c.draw_grid()
        def relight_fn(card, *args):
            card.light_map(card.lights)
            card.draw_grid()
        self.parent.parent.eventdiscard.bind(cards = partial(relight_fn, c))

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
        d0 = abs(map_pos1[0]-map_pos2[0])
        d1 = abs(map_pos1[1]-map_pos2[1])
        return max(d0,d1) + 0.5*min(d0,d1)

    def walkable_spots(self, map_pos, dist, spots):
        if len(spots)==0:
            spots[tuple(map_pos)] = 0
        if self[map_pos] in ['U','L','L0','L1','L2']:
            walk_costs = {'U': 1, 'L': 1, 'L0': 1, 'L1': 1, 'L2': 1}
        elif self[map_pos] in self.building_types:
            walk_costs = {'B': 1,'B0': 1,'U': 1, 'L': 1, 'L0': 1, 'L1': 1, 'L2': 1}
        for pos in self.iter_in_range(map_pos,1.5):
            if self[pos] in walk_costs:
                cur_dist = spots[tuple(map_pos)]+walk_costs[self[pos]]*self.dist(pos,map_pos)
                if tuple(pos) in spots and cur_dist>=spots[pos]:
                    continue
                if cur_dist <= dist:
                    spots[tuple(pos)] = cur_dist
                    self.walkable_spots(pos, dist, spots)
        return spots


class Stats(BoxLayout):
    kills = NumericProperty()
    knockouts = NumericProperty()
    contacts = NumericProperty()
    loot = NumericProperty()
    rounds = NumericProperty()
    missions = NumericProperty()
    showing = BooleanProperty()
    t_kills = NumericProperty()
    t_knockouts = NumericProperty()
    t_contacts = NumericProperty()
    t_loot = NumericProperty()
    t_rounds = NumericProperty()
    def reset(self, totals=True):
        self.kills = 0
        self.knockouts = 0
        self.contacts = 0
        self.loot = 0
        self.rounds = 0
        self.showing = False
        if totals:
            self.t_kills = 0
            self.t_knockouts = 0
            self.t_contacts = 0
            self.t_loot = 0
            self.t_rounds = 0
            self.t_showing = False

    def on_parent1(self, *args):
        parent = self.parent
        if parent is None:
            return
        self.center_x = -self.parent.width//4
        self.center_y = -self.parent.height//4
        self.width = self.parent.width//4
        self.height= self.parent.height//4
        center_x = parent.center_x
        center_y = parent.center_y
        width = 3*parent.width//4
        height= 3*parent.height//4
        anim = Animation(center_x=center_x, center_y=center_y, width=width, height=height, duration=0.2)
        anim.start(self)

    def on_touch_down(self, touch):
        for but in self.restart, self.quit, self.next:
            if but.collide_point(*touch.pos) and but.active:
                touch.grab(self)
                return True
        return True

    def on_touch_up(self, touch):
        if touch.grab_current==self:
            touch.ungrab(self.restart)
            if self.restart.collide_point(*touch.pos):
                self.parent.restart_game()
                self.reset()
                self.parent.menu_showing=False
                return True
            if self.next.collide_point(*touch.pos):
                self.parent.next_level()
                self.reset(False)
                self.parent.menu_showing=False
                return True
            if self.quit.collide_point(*touch.pos):
                touch.ungrab(self.quit)
                gameapp.stop()
                return True
            return True

class PlayArea(FloatLayout):
    menu_showing = ObjectProperty(False)
    def __init__(self,**kwargs):
        super().__init__(**kwargs)
        self.instructions = None
        self.cardselector = None
        self.first_start = True
        self.mission = None
        self.action_selector = None
        self.stats = Stats()

    def on_parent(self, *args):
        self.playercards = cards.make_player_cards(self)
        self.traitcards = cards.make_trait_cards(self)
        self.lootcards = cards.make_loot_cards(self)
        self.marketcards = cards.make_market_cards(self)
        self.skillcards = cards.make_skill_cards(self)

        self.restart_game()

    def card_setup(self, restart=False):
        #First clear everything out (this will remove all card widgets from the splay objects)
        self.map.cards = []
        self.exhausted.cards = []

        self.eventdeck.cards = []
        self.eventdiscard.cards = []

        if not restart:
            player_cards = self.playerdeck.cards + self.playerdiscard.cards + self.hand.cards + self.activecardsplay.cards
        self.hand.cards = []
        self.playerdeck.cards = []
        self.playerdiscard.cards = []
        self.activecardsplay.cards = []
        if restart:
            self.playertraits.cards = []
            self.loot1.cards = []
            self.loot2.cards = []
            self.loot3.cards = []
            self.marketdeck.cards = []
            self.skilldeck.cards = []

        #Now assign cards to decks
        if restart:
            random.shuffle(self.playercards)
            self.playerdeck.cards = self.playercards
            self.playertraits.cards = self.traitcards[:]
            for l in self.lootcards:
                random.shuffle(l)
            self.loot1.cards[:] = self.lootcards[0][:]
            self.loot2.cards[:] = self.lootcards[1][:]
            self.loot3.cards[:] = self.lootcards[2][:]
            random.shuffle(self.marketcards)
            self.marketdeck.cards[:] = self.marketcards[:]
            random.shuffle(self.skillcards)
            self.skilldeck.cards[:] = self.skillcards[:]
        else:
            random.shuffle(player_cards)
            self.playerdeck.cards = player_cards

        self.mission = cards.ContactMission(mission_level=self.stats.missions+1)
        self.map.cards[:] = self.mission.setup_map(self) #[:self.map.rows*self.map.cols]
        self.eventdeck.cards[:] = self.mission.setup_events(self)
        self.eventdeck.can_draw = True

    def token_setup(self):
#        self.noisetracker.reset()
#        player = PlayerToken(map_pos=(self.board.w-1,self.board.h-1))
        player = PlayerToken(map_pos=(0,0))

        spawns = []
        for c in self.map.cards:
            spawns += [self.board.get_pos_from_card(c,s) for s in c.spawns]
        guards = [GuardToken(map_pos=s) for s in spawns]

        loot = []
        for c in self.map.cards:
            loot += [self.board.get_pos_from_card(c,s) for s in c.targets]
        targets = [TargetToken(map_pos=s) for s in loot[:-1]]
        objective = ObjectiveToken(map_pos=loot[-1])

        mkt = []
        for c in self.map.cards:
            mkt += [self.board.get_pos_from_card(c,s) for s in c.markets]
        markets = [MarketToken(map_pos=s) for s in mkt]

        self.board.tokens = [player]+guards+targets+markets+[objective]
        self.board.scroll_to_player()


    def clear_state(self):
        if self.cardselector is not None:
            self.cardselector.cards = []
            self.remove_widget(self.cardselector)
            self.cardselector=None
        self.hand.clear_card_actions()
        self.hand.cancel_action()
        self.board.map_choices=[]

    def clear_and_check_end_game(self):
        self.clear_state()
        if self.board.active_player_clashing(): #Game over condition
            self.menu_showing=True
            self.stats.title.text = 'MISSION FAILED'
            self.hand.can_draw=False
            return True

    def on_menu_showing(self, *args):
        if self.menu_showing:
            if self.stats not in self.children:
                self.add_widget(self.stats)
        else:
            if self.stats in self.children:
                self.remove_widget(self.stats)

    def restart_game(self):
        self.clear_state()
        self.card_setup(restart=True)
        self.token_setup()
        self.stats.title.text = 'MISSION IN PROGRESS'

    def next_level(self):
        self.clear_state()
        self.card_setup()
        self.token_setup()
        self.stats.next.active=False
        self.stats.title.text = 'MISSION IN PROGRESS'
        self.skilldeck.select_draw(2,4)

    def level_complete(self):
        self.clear_state()
        self.stats.next.active=True
        self.menu_showing=True
        self.hand.can_draw=False
        self.stats.missions += 1
        self.eventdeck.can_draw=False
        self.stats.title.text = 'MISSION COMPLETED'


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
            self.pa.menu_showing = not self.pa.menu_showing
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

