/**
 * GLB paths under `public/models/`, resolved against Vite `base` (see vite.config.js).
 * Use these instead of `/models/...` so builds work with `base: './'` (e.g. itch.io HTML5).
 */
const base = import.meta.env.BASE_URL

export const MODEL_CAR_GLB = `${base}models/car.glb`
export const MODEL_CITY_NIGHT_GLB = `${base}models/city_night.glb`
