// The four Work entries the homepage features, in the order both pages show them. A homepage card links to its /work
// twin by this id, and the click lands with the pointer on the same card only because the two grids share this order,
// so both pages build their featured cards from this list and the type check catches a renamed or missing one.
// It imports nothing, so the tests can load it.
export const FEATURED = ["airbnb", "langchain-litellm", "iso", "harvard"] as const;

export type FeaturedId = (typeof FEATURED)[number];
