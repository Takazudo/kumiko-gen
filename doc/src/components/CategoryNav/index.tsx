import type { ReactNode } from 'react';
import useBaseUrl from '@docusaurus/useBaseUrl';
import categoryNav from '@site/src/data/category-nav.json';
import styles from './styles.module.css';

type CategoryData = {
  pages: Array<{ docId: string; title: string; position: number }>;
  subcategories: Array<{
    key: string;
    title: string;
    docId: string;
    hasIndex: boolean;
    position: number;
    pages: Array<{ docId: string; title: string; position: number }>;
  }>;
};

type CategoryKey = keyof typeof categoryNav;

export default function CategoryNav({ category }: { category: CategoryKey }): ReactNode {
  const docsBaseUrl = useBaseUrl('/docs/');
  const data = (categoryNav as Record<string, CategoryData>)[category];

  if (!data) {
    return <p className={styles.empty}>No documents found in this category.</p>;
  }

  return (
    <div>
      {data.pages.length > 0 && (
        <ul className={styles.navList}>
          {data.pages.map((page) => (
            <li key={page.docId} className={styles.navItem}>
              <a href={`${docsBaseUrl}${page.docId}`}>{page.title}</a>
            </li>
          ))}
        </ul>
      )}
      {data.subcategories.map((sub) => (
        <div key={sub.key}>
          <h3>
            {sub.hasIndex ? (
              <a href={`${docsBaseUrl}${sub.docId}`}>{sub.title}</a>
            ) : (
              <span className={styles.subcategoryLabel}>{sub.title}</span>
            )}
          </h3>
          {sub.pages.length > 0 && (
            <ul className={styles.navList}>
              {sub.pages.map((page) => (
                <li key={page.docId} className={styles.navItem}>
                  <a href={`${docsBaseUrl}${page.docId}`}>{page.title}</a>
                </li>
              ))}
            </ul>
          )}
        </div>
      ))}
      {data.pages.length === 0 && data.subcategories.length === 0 && (
        <p className={styles.empty}>No documents found in this category.</p>
      )}
    </div>
  );
}
