// Shared between the checkout route (decides whether to attach the coupon)
// and the subscribers-count endpoint (drives the "X spots left" UI copy) —
// keeping the threshold in one place avoids them drifting out of sync.
export const EARLY_BIRD_LIMIT = 100;
