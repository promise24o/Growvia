import type {ReactNode} from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import HomepageFeatures from '@site/src/components/HomepageFeatures';
import Heading from '@theme/Heading';

import styles from './index.module.css';

function HomepageHeader() {
  const {siteConfig} = useDocusaurusContext();
  return (
    <header className={clsx('hero hero--primary', styles.heroBanner)}>
      <div className="container">
        <Heading as="h1" className="hero__title">
          🌱 Welcome to Growvia Docs
        </Heading>
        <p className="hero__subtitle">
          Intelligent affiliate marketing and performance management platform designed to help organizations grow through trusted, data-driven partnerships.
        </p>
        <div className={styles.buttons}>
          <Link
            className="button button--secondary button--lg"
            to="/getting-started/introduction">
            Get Started - 5min ⏱️
          </Link>
          <Link
            className="button button--outline button--lg"
            to="/api/overview"
            style={{marginLeft: '1rem'}}>
            API Reference 📚
          </Link>
        </div>
      </div>
    </header>
  );
}

export default function Home(): ReactNode {
  const {siteConfig} = useDocusaurusContext();
  return (
    <Layout
      title="Growvia Tracking Documentation"
      description="Complete documentation for Growvia's affiliate tracking and attribution system">
      <HomepageHeader />
      <main>
        <HomepageFeatures />
      </main>
    </Layout>
  );
}
