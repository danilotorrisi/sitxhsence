import paho.mqtt.client as mqtt
from streamz import Stream
from streamz.dataframe import DataFrame, Random
import pandas as pd
import json
import sys
stream = Stream().buffer(100)

def on_message(client, userdata, message):
    topic = message.topic
    body = message.payload.decode('utf-8').replace('\'','\"')
    try:
        stream.emit((topic,json.loads(body)))
    except Exception as e:
        print('Ex')
        print(e)

mqttc = mqtt.Client()
mqttc.connect('test.mosquitto.org')
mqttc.on_message = on_message
mqttc.subscribe('e_sensor/+')

def pick(x):
    print(x)

stream.sink(pick)
mqttc.loop_forever()
