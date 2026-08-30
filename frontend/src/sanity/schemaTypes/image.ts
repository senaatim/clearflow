import imageUrlBuilder from '@sanity/image-url'
import { client } from '@/sanity/schemaTypes/client' // Import your Sanity client instance

// Initialize the image url builder
const builder = imageUrlBuilder(client)

// Export the urlFor helper function
export function urlFor(source: any) {
  return builder.image(source)
}