export const MIN_TRIGGER_STEP_SECONDS = 0.0001;

export function safeTriggerTime(
  requestedTime: number,
  currentTime: number,
  previousTime: number | null,
) {
  return Math.max(
    requestedTime,
    currentTime + MIN_TRIGGER_STEP_SECONDS,
    previousTime === null ? -Infinity : previousTime + MIN_TRIGGER_STEP_SECONDS,
  );
}
