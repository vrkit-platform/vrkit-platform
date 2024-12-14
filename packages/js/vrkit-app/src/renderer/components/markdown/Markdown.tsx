// REACT
import React, { useMemo } from "react"
import type { Options } from "react-markdown"
import ReactMarkdown from "react-markdown"

// CLSX
import clsx from "clsx"

// 3FV
import { getLogger } from "@3fv/logger-proxy"

// MUI
import type { SxProps, Theme } from "@mui/material/styles"
import { styled } from "@mui/material/styles"

// APP
import { alpha, ClassNamesKey, createClassNames, FillWidth, rem } from "vrkit-shared-ui"

import "!style-loader!css-loader!sass-loader!./code-highlight-block.scss"
import remarkGfm from "remark-gfm"
import rehypeRaw from "rehype-raw"
import rehypeHighlight from "rehype-highlight"

import Link from "@mui/material/Link"

import { Image } from "../image"

import { htmlToMarkdown, isMarkdownContent } from "./htmlToMarkdown"
import { isExternalLink } from "vrkit-app-renderer/routes/utils"
import { RouterLink } from "../app-router-link"

type ComponentTag = {
  [key: string]: any
}

const rehypePlugins = [rehypeRaw, rehypeHighlight, [remarkGfm, { singleTilde: false }]];

const mdComponents = {
  img: ({ node, ...other }: ComponentTag) => (
      <Image
          ratio="16/9"
          className={markdownClasses.contentImage}
          sx={{ borderRadius: 2 }}
          {...other}
      />
  ),
  a: ({ href, children, node, ...other }: ComponentTag) => {
    const linkProps = isExternalLink(href)
        ? { target: '_blank', rel: 'noopener' }
        : { component: RouterLink };
    
    return (
        <Link {...linkProps} href={href} className={markdownClasses.contentLink} {...other}>
          {children}
        </Link>
    );
  },
  pre: ({ children }: ComponentTag) => (
      <div className={markdownClasses.contentCodeBlock}>
        <pre>{children}</pre>
      </div>
  ),
  code({ className, children, node, ...other }: ComponentTag) {
    const language = /language-(\w+)/.exec(className || '');
    
    return language ? (
        <code {...other} className={className}>
          {children}
        </code>
    ) : (
        <code {...other} className={markdownClasses.contentCodeInline}>
          {children}
        </code>
    );
  },
};


const log = getLogger(__filename)
const { info, debug, warn, error } = log

const classPrefix = "markdown"
export const markdownClasses = createClassNames(classPrefix, "root",
    "contentPre",
    "contentCodeInline",
    "contentCodeBlock",
    "contentImage",
    "contentLink"
)
export type MarkdownClassKey = ClassNamesKey<typeof markdownClasses>

const MARGIN = '0.75em';

const MarkdownRoot = styled(ReactMarkdown, {
  name: "MarkdownRoot",
  label: "MarkdownRoot"
})(({theme}) => ({
  // root styles here
  '> * + *': {
    marginTop: 0,
    marginBottom: MARGIN,
  },
  /**
   * Heading & Paragraph
   */
  h1: { ...theme.typography.h3, fontSize:rem(1), fontWeight: 700},
  h2: { ...theme.typography.h4, fontSize:rem(1), fontWeight: 600 },
  h3: { ...theme.typography.h5, fontSize:rem(1), fontWeight: 500},
  h4: { ...theme.typography.h6, fontSize:rem(1), fontWeight: 500 },
  h5: { ...theme.typography.h6, fontSize:rem(1), fontWeight: 400 },
  h6: { ...theme.typography.h6, fontSize:rem(1), fontWeight: 400 },
  p: { ...theme.typography.body1, marginBottom: theme.spacing(0.5) },
  /**
   * Hr Divider
   */
  hr: {
    flexShrink: 0,
    borderWidth: 0,
    margin: `${theme.spacing(1)} 0`,
    msFlexNegative: 0,
    WebkitFlexShrink: 0,
    borderStyle: 'solid',
    borderBottomWidth: 'thin',
    borderColor: theme.palette.divider,
  },
  /**
   * Image
   */
  [`& .${markdownClasses.contentImage}`]: {
    width: '100%',
    height: 'auto',
    maxWidth: '100%',
    margin: `auto auto ${theme.spacing(0.5)}`,
  },
  /**
   * List
   */
  '& ul': {
    listStyleType: 'disc',
  },
  '& ul, & ol': {
    paddingLeft: 16,
    '& > li': {
      lineHeight: 1.2,
      '& > p': { margin: 0, display: 'inline-block' },
    },
  },
  /**
   * Blockquote
   */
  '& blockquote': {
    lineHeight: 1.2,
    // fontSize: '1.5em',
    // margin: '24px auto',
    position: 'relative',
    // fontFamily: 'Georgia, serif',
    padding: theme.spacing(1, 1, 1, 2),
    //color: theme.palette.text.secondary,
    borderLeft: `${theme.spacing(0.5)} solid ${alpha(theme.palette.grey['500'], 0.08)}`,
    // [theme.breakpoints.up('md')]: {
    //   width: '100%',
    //   maxWidth: 640,
    // },
    // '& p': {
    //   margin: 0,
    //   fontSize: 'inherit',
    //   fontFamily: 'inherit',
    // },
    '&::before': {
      left: 16,
      top: -8,
      display: 'block',
      //fontSize: '3em',
      content: '"\\201C"',
      position: 'absolute',
      color: theme.palette.text.disabled,
    },
  },
  /**
   * Code inline
   */
  [`& .${markdownClasses.contentCodeInline}`]: {
    padding: theme.spacing(0.25, 0.5),
    // color: theme.palette.text.secondary,
    fontSize: theme.typography.body2.fontSize,
    borderRadius: theme.shape.borderRadius / 2,
    backgroundColor: alpha(theme.palette.grey['500'], 0.2),
  },
  /**
   * Code Block
   */
  [`& .${markdownClasses.contentCodeBlock}`]: {
    position: 'relative',
    '& pre': {
      overflowX: 'auto',
      padding: theme.spacing(1),
      // color: theme.palette.common.white,
      borderRadius: theme.shape.borderRadius,
      backgroundColor: theme.palette.grey[900],
      fontFamily: "'JetBrainsMono', monospace",
      '& code': { fontSize: theme.typography.body2.fontSize },
    },
  },
  /**
   * Table
   */
  table: {
    // width: '100%',
    ...FillWidth,
    borderCollapse: 'collapse',
    border: `1px solid ${theme.palette.divider}`,
    'th, td': { padding: theme.spacing(1), border: `1px solid ${theme.palette.divider}` },
    'tbody tr:nth-of-type(odd)': { backgroundColor: theme.palette.background.neutral },
  },
  /**
   * Checkbox
   */
  input: {
    '&[type=checkbox]': {
      position: 'relative',
      cursor: 'pointer',
      '&:before': {
        content: '""',
        top: -2,
        left: -2,
        width: 17,
        height: 17,
        borderRadius: theme.shape.borderRadius,
        position: 'absolute',
        backgroundColor: theme.palette.grey[700]
      },
      '&:checked': {
        '&:before': { backgroundColor: theme.palette.primary.main },
        '&:after': {
          content: '""',
          top: 1,
          left: 5,
          width: 4,
          height: 9,
          position: 'absolute',
          transform: 'rotate(45deg)',
          msTransform: 'rotate(45deg)',
          WebkitTransform: 'rotate(45deg)',
          border: `solid ${theme.palette.common.white}`,
          borderWidth: '0 2px 2px 0',
        },
      },
    },
  },
}))


/**
 * Markdown Component Properties
 */

export interface MarkdownProps extends Options {
  asHtml?: boolean;
  sx?: SxProps<Theme>;
  className?: string
}

/**
 * Markdown Component
 *
 * @param { MarkdownProps } props
 */

export function Markdown({ children, className, sx, ...other }: MarkdownProps) {
  const content = useMemo(() => {
    if (isMarkdownContent(`${children}`)) {
      return children;
    }
    return htmlToMarkdown(`${children}`.trim());
  }, [children]);
  
  return (
      <MarkdownRoot
          children={content}
          components={mdComponents as Options['components']}
          rehypePlugins={rehypePlugins as Options['rehypePlugins']}
          /* base64-encoded images
           * https://github.com/remarkjs/react-markdown/issues/774
           * urlTransform={(value: string) => value}
           */
          className={clsx(markdownClasses.root,className)}
          sx={sx}
          {...other}
      />
  );
}


export default Markdown
