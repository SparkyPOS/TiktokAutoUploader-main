import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Accounts, Posts, errorMessage } from "../api/client";

export default function PostsPage() {
  const { data: accounts = [], isLoading: accountsLoading } = useQuery({
    queryKey: ["accounts"],
    queryFn: Accounts.list,
  });
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [count, setCount] = useState(20);
  const [cursor, setCursor] = useState(0);
  const [detailed, setDetailed] = useState(false);

  const selectedAccount = useMemo(
    () => accounts.find(a => a.id === selectedId) ?? accounts[0] ?? null,
    [accounts, selectedId],
  );

  const query = useQuery({
    queryKey: ["posts", selectedAccount?.id, count, cursor, detailed],
    enabled: !!selectedAccount,
    queryFn: () => Posts.list(selectedAccount!.id, { count, cursor, detailed }),
    retry: false,
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-2xl font-semibold">Posts</h2>
          <p className="text-sm text-slate-500 mt-1">
            Recent posts for a saved TikTok account.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <label className="text-sm text-slate-600">Account</label>
          <select
            className="input py-2"
            value={selectedAccount?.id ?? ""}
            onChange={e => setSelectedId(Number(e.target.value))}
            disabled={accountsLoading || accounts.length === 0}
          >
            {!accountsLoading && accounts.length === 0 && <option value="">No accounts</option>}
            {accounts.map(a => (
              <option key={a.id} value={a.id}>{a.username}</option>
            ))}
          </select>
        </div>
      </div>

      {selectedAccount && (
        <div className="card p-4 space-y-4">
          <div className="flex items-center gap-4 flex-wrap">
            <label className="text-sm text-slate-600">Count</label>
            <input
              type="number"
              min={1}
              max={100}
              className="input max-w-24"
              value={count}
              onChange={e => setCount(Math.max(1, Math.min(100, Number(e.target.value) || 1)))}
            />
            <label className="text-sm text-slate-600">Cursor</label>
            <input
              type="number"
              min={0}
              className="input max-w-24"
              value={cursor}
              onChange={e => setCursor(Math.max(0, Number(e.target.value) || 0))}
            />
            <label className="inline-flex items-center gap-2 text-sm text-slate-600">
              <input type="checkbox" checked={detailed} onChange={e => setDetailed(e.target.checked)} />
              Detailed
            </label>
            <button className="btn-primary" onClick={() => setCursor(0)}>
              Refresh
            </button>
          </div>

          {query.isLoading && <p className="text-slate-500">Loading posts…</p>}
          {query.isError && <p className="text-red-600">{errorMessage(query.error)}</p>}

          {query.data && (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-sm text-slate-500">
                <span>{query.data.posts.length} posts</span>
                {query.data.has_more && <span>More posts available</span>}
              </div>

              {query.data.posts.length === 0 && (
                <p className="text-slate-500">No posts found for this account.</p>
              )}

              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {query.data.posts.map(post => {
                  const description = post.description || post.caption || post.title || "No description";
                  const commentCount = post.comment_count ?? post.comments ?? undefined;
                  const commentList = post.comments_list ?? [];
                  const formatTimestamp = (value: number | string | null | undefined) => {
                    if (value === null || value === undefined || value === "") return "Unknown time";
                    const ms = Number(value) * 1000;
                    const date = Number.isFinite(ms) && ms > 0 ? new Date(ms) : new Date(String(value));
                    return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleString();
                  };
                  return (
                    <article key={String(post.id ?? `${post.title ?? "post"}-${post.created_at}`)} className="border border-slate-200 rounded-lg overflow-hidden bg-white">
                      {post.video_url ? (
                        <video
                          src={post.video_url}
                          controls
                          preload="metadata"
                          className="h-48 w-full object-cover bg-slate-100"
                        />
                      ) : post.cover_url || post.thumbnail ? (
                        <img
                          src={post.cover_url || post.thumbnail || undefined}
                          alt={description}
                          className="h-48 w-full object-cover"
                        />
                      ) : (
                        <div className="h-48 w-full bg-slate-100 flex items-center justify-center text-slate-400">
                          No video or image
                        </div>
                      )}
                      <div className="p-4 space-y-3">
                        <div className="text-xs text-slate-500">
                          {formatTimestamp(post.created_at)}
                        </div>
                        <h3 className="font-medium text-base line-clamp-2">{post.title || description}</h3>

                        <div className="rounded-md bg-slate-50 p-2.5">
                          <div className="text-[11px] uppercase tracking-wide text-slate-500 font-medium mb-1">Caption</div>
                          <p className="text-sm text-slate-700 whitespace-pre-wrap break-words">{description}</p>
                        </div>

                        {(detailed || commentCount !== undefined || post.likes !== undefined || post.shares !== undefined || post.visibility !== undefined) && (
                          <div className="grid grid-cols-2 gap-2 text-xs text-slate-600">
                            {post.likes !== undefined && (
                              <div className="rounded bg-slate-100 px-2 py-1.5">Likes: {post.likes}</div>
                            )}
                            {commentCount !== undefined && (
                              <div className="rounded bg-slate-100 px-2 py-1.5">Comments: {commentCount}</div>
                            )}
                            {post.shares !== undefined && (
                              <div className="rounded bg-slate-100 px-2 py-1.5">Shares: {post.shares}</div>
                            )}
                            {post.visibility !== undefined && (
                              <div className="rounded bg-slate-100 px-2 py-1.5">Visibility: {String(post.visibility)}</div>
                            )}
                            {post.status && (
                              <div className="rounded bg-slate-100 px-2 py-1.5 col-span-2">Status: {post.status}</div>
                            )}
                          </div>
                        )}

                        {commentList.length > 0 && (
                          <div className="rounded-md border border-slate-200 bg-slate-50 p-2.5">
                            <div className="text-[11px] uppercase tracking-wide text-slate-500 font-medium mb-2">Comments</div>
                            <div className="space-y-2">
                              {commentList.map((comment, index) => (
                                <div key={`${post.id ?? "post"}-comment-${comment.id ?? index}`} className="rounded bg-white p-2">
                                  <div className="text-[10px] text-slate-500 mb-1">{formatTimestamp(comment.created_at)}</div>
                                  <div className="text-sm text-slate-700 whitespace-pre-wrap break-words">{comment.text || "(empty comment)"}</div>
                                  {comment.user && <div className="text-[10px] text-slate-500 mt-1">By {comment.user}</div>}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {post.url && (
                          <a href={post.url} target="_blank" rel="noreferrer" className="inline-block text-sm text-brand-600 underline">
                            Open post
                          </a>
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>

              {query.data.has_more && (
                <div className="flex justify-end">
                  <button
                    className="btn-secondary"
                    onClick={() => setCursor(query.data.next_cursor)}
                  >
                    Load older posts
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
