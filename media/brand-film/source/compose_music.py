"""An original 45-second instrumental cue, synthesized for X-lab AI.
96 BPM; D major; no samples, speech, or third-party recordings.
"""
from pathlib import Path
import json
import numpy as np
from scipy.io import wavfile
from scipy.signal import butter, sosfilt

ROOT=Path(__file__).resolve().parents[1]
SR=48000
DURATION=45.0
BEAT=60/96
BAR=4*BEAT
N=int(SR*DURATION)
mix=np.zeros((N,2),dtype=np.float64)
rng=np.random.default_rng(20171008)

def add(signal,start,amp=1.0,pan=0.0):
    start=int(round(start*SR))
    if start>=N:return
    signal=signal[:max(0,N-start)]*amp
    n=len(signal)
    theta=(pan+1)*np.pi/4
    mix[start:start+n,0]+=signal*np.cos(theta)
    mix[start:start+n,1]+=signal*np.sin(theta)

def tone(midi,start,dur,amp,kind="pluck",pan=0):
    t=np.arange(int(SR*dur))/SR
    f=440*2**((midi-69)/12)
    if kind=="pad":
        carrier=(np.sin(2*np.pi*f*t)+.26*np.sin(2*np.pi*f*1.0023*t+.3)+.18*np.sin(2*np.pi*f*.9981*t+1)+.10*np.sin(4*np.pi*f*t))
        attack=np.clip(t/.72,0,1)**1.5
        release=np.clip((dur-t)/.9,0,1)**1.6
        env=attack*release*(.90+.10*np.sin(2*np.pi*.18*t))
    elif kind=="bass":
        carrier=np.sin(2*np.pi*f*t)+.18*np.sin(4*np.pi*f*t)
        env=np.minimum(t/.025,1)*np.exp(-t/1.0)*np.minimum((dur-t)/.12,1)
    else:
        mod=.7*np.exp(-t*5.0)*np.sin(2*np.pi*f*2*t)
        carrier=np.sin(2*np.pi*f*t+mod)+.18*np.sin(4*np.pi*f*t)*np.exp(-t*5)
        env=np.minimum(t/.012,1)*np.exp(-t/0.65)*np.minimum((dur-t)/.08,1)
    add(carrier*env,start,amp,pan)

chords=[
 [50,57,61,64,66],[50,57,61,64,66],
 [47,54,57,62,66],[47,54,57,62,66],
 [43,50,54,57,62],[45,52,57,59,64],
 [50,57,61,64,66],[50,57,61,64,66],
 [47,54,57,62,66],[47,54,57,62,66],
 [43,50,54,57,62],[43,50,54,57,62],
 [45,52,57,59,64],[45,52,57,59,64],
 [50,57,61,64,66],[50,57,61,64,66],
 [43,50,54,57,62],[50,57,61,64,66]]
for bar,notes in enumerate(chords):
    start=bar*BAR
    for i,note in enumerate(notes):
        tone(note,start,BAR+1.1,.035 if bar>1 else .027,"pad",(i-2)*.33)
    if bar>=2:
        tone(notes[0]-12,start,2.3,.15 if bar<15 else .105,"bass",0)
    if 2<=bar<17:
        order=[1,3,4,2,1,4,3,2]
        for step,idx in enumerate(order):
            if bar<5 and step%2:continue
            if bar>=15 and step%2:continue
            amp=.043 if bar<8 else .052
            tone(notes[idx]+12,start+step*BEAT/2,1.2,amp*(.9+.12*rng.random()),"pluck",(-.55 if step%2 else .55))
    if 5<=bar<15:
        for beat in [0,2]:
            t=np.arange(int(.46*SR))/SR
            phase=2*np.pi*(44*t+(88-44)*(.035)*(1-np.exp(-t/.035)))
            kick=np.sin(phase)*np.exp(-t*11)*np.minimum(t/.004,1)
            add(kick,start+beat*BEAT,.18)
        for beat in [1,3]:
            t=np.arange(int(.22*SR))/SR
            noise=rng.standard_normal(len(t))
            noise=sosfilt(butter(2,[1300,6200],btype="bandpass",fs=SR,output="sos"),noise)
            add(noise*np.exp(-t*24)*np.minimum(t/.008,1),start+beat*BEAT,.025,.12)
        for step in range(8):
            t=np.arange(int(.12*SR))/SR
            noise=rng.standard_normal(len(t))
            noise=sosfilt(butter(2,7200,btype="highpass",fs=SR,output="sos"),noise)
            add(noise*np.exp(-t*65),start+step*BEAT/2,.008 if step%2 else .0055,(-.35 if step%2 else .35))
# A sparse original melodic motif, with room for the brand reveals.
melodies={
 2:[(0,74),(1.5,78),(3,76)],
 3:[(0,74),(2,69)],
 4:[(0,71),(1.5,74),(3,78)],
 5:[(0,76),(2.5,73)],
 6:[(0,74),(2,78),(3,81)],
 7:[(1,78),(2.5,76)],
 8:[(0,74),(1.5,78),(3,81)],
 9:[(0,78),(2,74)],
 10:[(0,74),(2,78),(3,81)],
 11:[(0,83),(2,81)],
 12:[(0,81),(1.5,76),(3,73)],
 13:[(0,76),(2.5,78)],
 14:[(0,78),(2,76),(3,74)],
 15:[(0,74),(2,69)],
 16:[(0,71),(2,74)],
 17:[(0,74)]}
for bar,notes in melodies.items():
    for beat,n in notes:tone(n,bar*BAR+beat*BEAT,1.65,.047 if bar<15 else .032,"pluck",.07)
# Stereo ambience derived entirely from the original synthesized cue.
dry=mix.copy()
for seconds,gain in [(0.1875,.13),(0.3125,.15),(0.46875,.11),(0.6875,.08),(1.09375,.04)]:
    k=int(seconds*SR)
    mix[k:,0]+=dry[:-k,1]*gain
    mix[k:,1]+=dry[:-k,0]*gain
t=np.arange(N)/SR
mix*=np.minimum(t/1.5,1)[:,None]
mix*=np.minimum(np.maximum((DURATION-t)/3.0,0),1)[:,None]**1.2
peak=np.max(np.abs(mix))
mix*=.78/peak
wavfile.write(ROOT/"assets"/"music_raw.wav",SR,mix.astype(np.float32))
(ROOT/"source"/"music_notes.json").write_text(json.dumps({
 "title":"指数点亮 / Potential, amplified.",
 "duration_seconds":DURATION,"bpm":96,"key":"D major",
 "type":"Original synthesized instrumental composition",
 "speech":False,"third_party_recordings":False,
 "sections":[[0,5,"Ignition"],[5,12.5,"Exponent"],[12.5,20,"Idea"],[20,30,"System"],[30,37.5,"Applications"],[37.5,45,"Invitation"]]
},ensure_ascii=False,indent=2))
print(json.dumps({"duration":DURATION,"sample_rate":SR,"peak_before_loudness":float(np.max(np.abs(mix))),"channels":2}))

