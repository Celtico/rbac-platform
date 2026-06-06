import { createApi } from "unsplash-js";

// Add VITE_UNSPLASH_ACCESS_KEY to your .env.local file
const unsplash = createApi({
  accessKey: import.meta.env.VITE_UNSPLASH_ACCESS_KEY ?? "",
});

export default unsplash;
