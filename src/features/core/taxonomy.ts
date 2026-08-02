import { getCollection } from 'astro:content';
import { selectActiveEntries } from './collections';
import { categoryData, tagData, type TaxonomyItem } from './data';

export const normalizeSlug = (value: string) => value.trim().toLowerCase();

type PostTaxonomySource = {
  data: {
    categories: string[];
    tags: string[];
    date?: Date;
  };
};

function metadataMap(items: TaxonomyItem[]) {
  return new Map(items.map((item, index) => [
    normalizeSlug(item.slug),
    {
      item: {
        ...item,
        slug: normalizeSlug(item.slug),
      },
      index,
    },
  ]));
}

const categoryMetadata = metadataMap(categoryData);
const tagMetadata = metadataMap(tagData);

function defaultTaxonomyItem(slug: string): TaxonomyItem {
  const normalized = normalizeSlug(slug);
  return {
    slug: normalized,
    name: normalized,
    description: '',
  };
}

export function getCategory(slug: string) {
  const normalized = normalizeSlug(slug);
  return categoryMetadata.get(normalized)?.item ?? defaultTaxonomyItem(normalized);
}

export function getTag(slug: string) {
  const normalized = normalizeSlug(slug);
  return tagMetadata.get(normalized)?.item ?? defaultTaxonomyItem(normalized);
}

export function getCategoryPath(slug: string) {
  return `/categories/${getCategory(slug).slug}`;
}

export function getTagPath(slug: string) {
  return `/tags/${getTag(slug).slug}`;
}

function sortByMetadata(items: TaxonomyItem[], metadata: Map<string, { item: TaxonomyItem; index: number }>) {
  return [...items].sort((a, b) => {
    const aIndex = metadata.get(a.slug)?.index ?? Number.MAX_SAFE_INTEGER;
    const bIndex = metadata.get(b.slug)?.index ?? Number.MAX_SAFE_INTEGER;

    if (aIndex !== bIndex) {
      return aIndex - bIndex;
    }

    return a.slug.localeCompare(b.slug, 'zh-CN');
  });
}

async function resolvePosts(posts?: PostTaxonomySource[]) {
  return posts ?? selectActiveEntries(await getCollection('posts'), 'posts');
}

export async function getAllCategories(posts?: PostTaxonomySource[]) {
  const slugs = new Set<string>();

  for (const post of await resolvePosts(posts)) {
    for (const slug of post.data.categories) {
      const normalized = normalizeSlug(slug);
      if (normalized) slugs.add(normalized);
    }
  }

  return sortByMetadata([...slugs].map(getCategory), categoryMetadata);
}

export async function getAllTags(posts?: PostTaxonomySource[]) {
  const slugs = new Set<string>();

  for (const post of await resolvePosts(posts)) {
    for (const slug of post.data.tags) {
      const normalized = normalizeSlug(slug);
      if (normalized) slugs.add(normalized);
    }
  }

  return sortByMetadata([...slugs].map(getTag), tagMetadata);
}

export function countCategories(posts: Array<{ data: { categories: string[] } }>) {
  const counts = new Map<string, number>();

  for (const post of posts) {
    for (const slug of post.data.categories) {
      const normalized = normalizeSlug(slug);
      if (!normalized) continue;
      const category = getCategory(slug);
      counts.set(category.slug, (counts.get(category.slug) ?? 0) + 1);
    }
  }

  return counts;
}

export function countTags(posts: Array<{ data: { tags: string[] } }>) {
  const counts = new Map<string, number>();

  for (const post of posts) {
    for (const slug of post.data.tags) {
      const normalized = normalizeSlug(slug);
      if (!normalized) continue;
      const tag = getTag(slug);
      counts.set(tag.slug, (counts.get(tag.slug) ?? 0) + 1);
    }
  }

  return counts;
}
