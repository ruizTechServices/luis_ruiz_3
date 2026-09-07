import Link from "next/link";
import { ArrowLeft, ArrowUpRight } from "lucide-react";
import { MarkdownContent } from "@/components/content/markdown";
import { articleDate, readingMinutes, stripRepeatedTitle } from "@/lib/content/format";
import { getBlogPost } from "@/lib/public-content/data";
import { pageMetadata } from "@/lib/seo/metadata";
import { absoluteUrl } from "@/lib/seo/site-url";
type Props = { params: Promise<{id:string}> };
export async function generateMetadata({params}:Props) {
  const {id}=await params; const {post}=await getBlogPost(id);
  const metadata = pageMetadata(post.title ?? "Article", post.summary ?? "Notes by Luis Ruiz.", `/blog/${id}`);
  return {...metadata, openGraph:{...metadata.openGraph,type:"article",publishedTime:post.published_at ?? post.created_at,modifiedTime:post.updated_at,authors:["Luis Ruiz"]}};
}
export default async function BlogPostPage({params}:Props) {
  const {id}=await params; const {post,comments}=await getBlogPost(id);
  const date=post.published_at ?? post.created_at;
  const schema={"@context":"https://schema.org","@type":"BlogPosting",headline:post.title,description:post.summary,datePublished:date,dateModified:post.updated_at,author:{"@type":"Person",name:"Luis Ruiz",url:absoluteUrl("/")},mainEntityOfPage:absoluteUrl(`/blog/${post.id}`)};
  return <main id="main-content" className="mx-auto w-full max-w-3xl px-6 py-14 sm:py-20"><script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(schema).replace(/</g,"\\u003c")}}/><Link href="/blog" className="text-link mb-10 text-muted-foreground"><ArrowLeft size={16}/> All writing</Link><article><p className="eyebrow mb-4">{post.tags?.split(",")[0]?.trim() || "Thoughts & notes"}</p><h1 className="font-display text-4xl leading-[1.13] tracking-tight sm:text-5xl">{post.title}</h1>{post.summary ? <p className="mt-6 text-xl leading-9 text-muted-foreground">{post.summary}</p>:null}<div className="my-8 flex items-center gap-4 border-y border-border py-5"><span aria-hidden="true" className="font-display flex size-10 items-center justify-center rounded-full bg-secondary text-xl italic text-primary">lr.</span><div><p className="text-sm font-medium">Luis Ruiz</p><p className="mt-1 text-xs text-muted-foreground"><time dateTime={date}>{articleDate(date)}</time> · {readingMinutes(post.body)} min read</p></div></div><MarkdownContent content={stripRepeatedTitle(post.body ?? "",post.title)}/>{post.references ? <section className="mt-12 rounded-xl border border-border p-6"><h2 className="eyebrow mb-4">Sources & further reading</h2><MarkdownContent content={post.references}/></section>:null}{post.tags ? <div className="mt-10 flex flex-wrap gap-2">{post.tags.split(",").map(tag=><span className="rounded-full bg-muted px-3 py-1.5 text-xs text-muted-foreground" key={tag}>{tag.trim()}</span>)}</div>:null}</article>{comments.length ? <section className="mt-12 border-t border-border pt-8"><h2 className="font-display text-2xl">Reader notes</h2>{comments.map(comment=><article key={comment.id} className="mt-4 rounded-xl border border-border p-5"><p className="text-sm leading-7">{comment.content}</p><p className="mt-3 text-xs text-muted-foreground">Reader{comment.created_at ? ` · ${articleDate(comment.created_at)}` : ""}</p></article>)}</section>:null}<div className="mt-14 border-t border-border pt-8"><p className="font-display text-2xl">Have something you’d like to build?</p><Link href="/contact" className="text-link mt-4">Start a conversation <ArrowUpRight size={16}/></Link></div></main>;
}
