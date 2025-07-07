// 'use client';

/*
  Step tracking service that leverages the DeviceMotion API (accelerometer) to estimate step counts on-device.
  This works entirely offline – no external SDKs – and emits a callback whenever the cumulative step count changes.
  For browsers (iOS Safari) that gate motion sensors behind a permission prompt we attempt to request it politely.
*/

export type StepUpdateCallback = (steps: number) => void;

class StepService {
  private stepCount = 0;
  private lastStepTs = 0; // timestamp of last detected step
  private readonly threshold = 1.2; // g-force delta threshold (empirically chosen)
  private readonly debounce = 300; // ms – minimum time between steps to avoid double-count
  private callback?: StepUpdateCallback;
  private listener?: (e: DeviceMotionEvent) => void;

  start(cb: StepUpdateCallback) {
    if (typeof window === 'undefined' || this.listener) return;

    this.callback = cb;

    const enableListening = () => {
      this.listener = (e: DeviceMotionEvent) => {
        if (!e.accelerationIncludingGravity) return;
        const ax = e.accelerationIncludingGravity.x ?? 0;
        const ay = e.accelerationIncludingGravity.y ?? 0;
        const az = e.accelerationIncludingGravity.z ?? 0;
        // Calculate magnitude relative to gravity (g-force)
        const magnitude = Math.sqrt(ax * ax + ay * ay + az * az) / 9.81;
        const now = Date.now();
        if (magnitude > this.threshold && now - this.lastStepTs > this.debounce) {
          this.lastStepTs = now;
          this.stepCount += 1;
          this.callback?.(this.stepCount);
        }
      };
      window.addEventListener('devicemotion', this.listener, false);
    };

    // iOS 13+ requires explicit permission
    // @ts-expect-error non-standard typing
    if (typeof DeviceMotionEvent !== 'undefined' && DeviceMotionEvent.requestPermission) {
      // @ts-expect-error iOS specific
      DeviceMotionEvent.requestPermission().then((state: string) => {
        if (state === 'granted') enableListening();
      }).catch(() => {/* ignored */});
    } else {
      enableListening();
    }
  }

  stop() {
    if (this.listener) {
      window.removeEventListener('devicemotion', this.listener);
      this.listener = undefined;
    }
    this.callback = undefined;
  }

  reset() {
    this.stepCount = 0;
    this.lastStepTs = 0;
  }
}

export const stepService = new StepService(); 