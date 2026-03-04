import { defineConfig } from 'sanity'
import { structureTool } from 'sanity/structure'
import { schemaTypes } from './src/sanity/schemaTypes'

export default defineConfig({
  name: 'default',
  title: 'Dahriola Store',
  projectId: '44u7xxs3',
  dataset: 'production',
  basePath: '/admin',
  plugins: [structureTool()],
  schema: {
    types: schemaTypes,
  },
})