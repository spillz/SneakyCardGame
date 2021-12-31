#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Created on Sun Sep 26 11:20:00 2021

@author: damien
"""

from kivy.app import App
from kivy.lang import Builder
from kivy.uix.label import Label
from kivy.uix.floatlayout import FloatLayout
from kivy.uix.relativelayout import RelativeLayout
from kivy.uix.boxlayout import BoxLayout

kv1 ='''
<CardSplay>:
    size_hint:None,None
    text: 'DECK'
    canvas.after:
        Color:
            rgba: (1,1,1,1)
        Line:
            width: 1
            rectangle: root.x, root.y, root.width, root.height
    Label:
        text: root.text
        pos_hint: {'center_x': 0.5, 'center_y': 0.5}

<Test>:
    playerdiscard: playerdiscard
    playerdeck: playerdeck
    playertableau: playertableau
    exhausted: exhausted
    hand: hand
    map: map
    loot1: loot1
    loot2: loot2
    loot3: loot3
    marketdeck: marketdeck
    marketoffer: marketoffer
    eventdeck: eventdeck

    map_size: 3,3
    card_base_size: self.width//(6+self.map_size[0]), self.height//(1+self.map_size[1])
    card_size: min(self.card_base_size[0],self.card_base_size[1]*5//7), min(self.card_base_size[1],self.card_base_size[0]*7//5)
    paddy: (self.height - (1+self.map_size[1])*self.card_size[1])//(1+self.map_size[1])
    CardSplay: #PlayerDiscard:
        id: playerdiscard
        size_hint: None, None
        size: int(root.card_size[0]*1.2), root.card_size[1]
        pos: 0,0
    CardSplay: #PlayerDeck:
        id: playerdeck
        size_hint: None, None
        size: int(root.card_size[0]*1.2), root.card_size[1]
        pos: root.card_size[0]*1.2, 0
    CardSplay: #Hand:
        id: hand
        size_hint: None, None
        size: int(root.card_size[0]*6), root.card_size[1]
        pos: 2*1.2*root.card_size[0] + root.width//40, 0
    CardSplay: #PlayerTableau:
        id: playertableau
        size_hint: None, None
        size: int(root.card_size[0]*6), root.card_size[1]
        y: root.card_size[1]
        x: root.width//40
    CardSplay: #Exhausted:
        id: exhausted
        size_hint: None, None
        size: int(root.card_size[0]*1.2), root.card_size[1]
        y: root.card_size[1]
        x: root.width//20 + 6*root.card_size[0]
    CardSplay: #LootDeck:
        id: loot1
        size_hint: None, None
        size: int(root.card_size[0]*1.2), root.card_size[1]
        x: 0
        y: root.height - self.height
    CardSplay: #LootDeck:
        id: loot2
        size_hint: None, None
        size: int(root.card_size[0]*1.2), root.card_size[1]
        x: root.card_size[0] + root.width//40
        y: root.height - self.height
    CardSplay: #LootDeck:
        id: loot3
        size_hint: None, None
        size: int(root.card_size[0]*1.2), root.card_size[1]
        x: root.card_size[0]*2 + 2*root.width//40
        y: root.height - self.height
    CardSplay: #EventDeck:
        id: eventdeck
        size_hint: None, None
        size: int(root.card_size[0]*1.2), root.card_size[1]
        x: root.card_size[0]*4 + 4*root.width//40
        y: root.height - self.height
    CardSplay: #MarketDeck:
        id: marketdeck
        size_hint: None, None
        size: int(root.card_size[0]*1.2), root.card_size[1]
        x: root.width//40
        y: root.height-self.height-root.card_size[1]-root.paddy
    CardSplay: #MarketOffer:
        id: marketoffer
        size_hint: None, None
        size: int(root.card_size[0]*4), root.card_size[1]                
        x: 2*root.width//40+root.card_size[0]*6//5
        y: root.height-self.height-root.card_size[1]-root.paddy
    #Map:
    #    id: map
    #    rows: root.map_size[0]
    #    cols: root.map_size[1]
    #    size_hint: None, None
    #    size: root.card_size[0]*root.map_size[0], root.card_size[1]*root.map_size[1]
    #    x: root.width - self.width
    #    y: root.height - self.height
'''

kv = '''
<Card>:
    size_hint:None,None
    text: ''
    canvas.before:
        Color:
            rgba: (1,1,1,1)
        Line:
            width: 1
            rectangle: root.x, root.y, root.width, root.height
    Label:
        text: root.text
        
'''

class CardSplay(RelativeLayout):
    pass

class Test(FloatLayout):
    pass

class MyApp(App):

    def build(self):
        Builder.load_string(kv1)
        self.t = Test()
        return self.t


if __name__ == '__main__':
    app = MyApp()
    app.run()