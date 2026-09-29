import classNames from 'classnames';
import { useReferences, useSiteManifest } from '@myst-theme/providers';
import type { NodeRenderer } from '@myst-theme/providers';
import { doi } from 'doi-utils';
import { InlineError } from './inlineError.js';
import { HoverPopover } from './components/index.js';
import { MyST } from './MyST.js';
import type { GenericParent } from 'myst-common';

function useNumberedReferences(): boolean {
  const config = useSiteManifest();
  const numbered_references = !!config?.options?.numbered_references;
  return numbered_references;
}

interface HoverContext {
  ast: GenericParent;
  url?: string;
}

function CiteChild({ html, ctx }: { html?: string; ctx?: HoverContext | undefined }) {
  return (
    <div className="hover-document article w-[500px] sm:max-w-[500px] p-3">
      {!!ctx && (
        <>
          <MyST ast={ctx.ast} />
          {ctx.url && <a href={ctx.url}>See more</a>}
        </>
      )}
      <div className="p-3" dangerouslySetInnerHTML={{ __html: html || '' }} />
    </div>
  );
}

export const CiteGroup: NodeRenderer<GenericParent> = ({ node, className }) => {
  const allCite = node.children?.every((child) => child.type === 'cite') ?? false;
  return (
    <span
      className={classNames(
        {
          'cite-group': allCite,
          'xref-group': !allCite,
          narrative: node.kind === 'narrative',
          parenthetical: node.kind === 'parenthetical',
        },
        className,
      )}
    >
      <MyST ast={node.children} />
    </span>
  );
};

export const Cite = ({
  label,
  error,
  children,
  className,
  ctx,
}: {
  label?: string;
  error?: boolean;
  children: React.ReactNode;
  className?: string;
  ctx?: HoverContext | undefined;
  meta?: any;
}) => {
  const references = useReferences();
  if (!label) {
    return (
      <InlineError
        value="cite (no label)"
        message={'Citation Has No Label'}
        className={className}
      />
    );
  }
  const { html, doi: doiString, url: refUrl } = references?.cite?.data[label] ?? {};
  if (error) {
    return <InlineError value={label} message={'Citation Not Found'} className={className} />;
  }
  const url = doiString ? doi.buildUrl(doiString as string) : refUrl;
  const isButtonLike = (className ?? '').split(' ').includes('button');
  return (
    <HoverPopover openDelay={300} card={<CiteChild html={html} ctx={ctx} />}>
      <cite className={className}>
        {url && (
          <a
            href={url}
            target="_blank"
            rel="noreferrer"
            className={classNames({ 'hover-link': !isButtonLike })}
          >
            {children}
          </a>
        )}
        {!url && <span className="hover-link">{children}</span>}
      </cite>
    </HoverPopover>
  );
};

export const CiteRenderer: NodeRenderer = ({ node, className }) => {
  const numbered = useNumberedReferences();
  return (
    <Cite
      label={node.label}
      error={node.error}
      className={classNames(className, node.class)}
      ctx={node.data?.ctx}
    >
      {numbered && node.kind === 'parenthetical' ? node.enumerator : <MyST ast={node.children} />}
    </Cite>
  );
};

const CITE_RENDERERS: Record<string, NodeRenderer> = {
  citeGroup: CiteGroup,
  cite: CiteRenderer,
};

export default CITE_RENDERERS;
