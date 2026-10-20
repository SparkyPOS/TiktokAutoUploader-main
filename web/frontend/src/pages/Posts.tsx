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
                      <div className="p-4 space-y-2">
                        <div className="text-xs text-slate-500">
                          {post.created_at ? new Date(Number(post.created_at) * 1000 || String(post.created_at)).toLocaleString() : "Unknown date"}
                        </div>
                        <h3 className="font-medium line-clamp-2">{post.title || description}</h3>
                        <p className="text-sm text-slate-600 line-clamp-3">{description}</p>
                        {(detailed || commentCount !== undefined) && (
                          <div className="text-xs text-slate-500 space-y-1">
                            {post.visibility !== undefined && <div>Visibility: {String(post.visibility)}</div>}
                            {post.likes !== undefined && <div>Likes: {post.likes}</div>}
                            {commentCount !== undefined && <div>Comments: {commentCount}</div>}
                            {post.shares !== undefined && <div>Shares: {post.shares}</div>}
                            {post.status && <div>Status: {post.status}</div>}
                          </div>
                        )}
                        {post.url && (
                          <a href={post.url} target="_blank" rel="noreferrer" className="text-sm text-brand-600 underline">
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
