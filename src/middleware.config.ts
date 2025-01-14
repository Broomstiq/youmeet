export const config = {
  runtime: 'nodejs',
  unstable_allowDynamic: [
    '/node_modules/next/dist/compiled/ua-parser-js/**',
    '/node_modules/next/dist/server/**',
    // add other problematic dependencies here
  ],
} 