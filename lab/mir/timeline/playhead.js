/* timeline/playhead.js — THE PLAYHEAD: a paint subscriber, not a second clock or permanent animation loop (harvested from
 * BASINS app/timeline-playhead.js, 2026-10-02).  It paints by transform only, follows the hand's beat while a scrub is
 * live (controller.handBeat), and draws a short motion tail while the clock runs.  Changed for the kit: reduced motion is
 * the kit's policy (core/motion.js motionPolicy: the app's setting wins, 'auto' follows the OS), passed as `reduced`. */
import { motionPolicy } from '../core/motion.js';

export function createTimelinePlayhead({ head, tail, clock, controller, visible, pixels, scroll, reduced = () => motionPolicy() !== 'full' }) {
  let previous=null,time=0;
  function paint(reset=false){
    if(!visible()){previous=null;tail.style.width='0px';return;}
    const hand=controller.handBeat?.(),beat=hand===null||hand===undefined?clock.beats():hand,now=performance.now(),dt=(now-time)/1000,delta=previous===null?0:beat-previous;
    const x=beat*pixels()-scroll();head.style.transform=`translateX(${x}px)`;
    const moving=!reset&&clock.playing()&&!controller.isScrubbing()&&!reduced()&&dt>0&&dt<.5&&delta>0&&delta<Math.max(.5,clock.bpm()/60*dt*3);
    tail.style.width=(moving?Math.min(48,delta/dt*pixels()*.16):0)+'px';
    head.classList.toggle('scrubbing',controller.isScrubbing());
    previous=beat;time=now;
  }
  return {paint,reset(){previous=null;paint(true);}};
}
