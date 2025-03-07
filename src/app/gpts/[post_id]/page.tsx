"use client";
import GiscusApp from "@/components/ui-tony/giscus";
import Link from "next/link";
import toast from "react-hot-toast";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import useSWR from "swr";
import { useEffect, useState } from "react";
import { Loader2, Loader2Icon, Terminal } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface GPTsItemProps {
  item: {
    author?: string;
    id?: string;
    post_id?: string;
    short_url?: string;
    show_desc?: string;
    show_image?: string;
    show_name?: string;
    show_welcome?: string;
  };
}

export default function Page({ params }: { params: { post_id: number } }) {
  // 点赞的时候请求api
  const { status } = useSession();

  const [loading, setLoading] = useState(false);

  const postID = params["post_id"];
  const fetcher = () =>
    fetch(`/api/posts/detail`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ post_id: postID }),
    }).then((res) => res.json());

  const { data, error, isLoading } = useSWR<GPTsItemProps>(
    `/api/posts?page=${postID}`,
    fetcher,
  );

  useEffect(() => {
    fetch("/api/posts/viewed", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ post_id: postID }),
    }).then((res) => {});
  }, [postID]);

  const gptsData = data?.item;

  if (error) return <div className="min-h-[80vh]">failed to load</div>;
  if (isLoading)
    return (
      <div className="min-h-[80vh]">
        {" "}
        <div className="absolute  top-1/2 flex  w-full flex-col items-center">
          <Loader2 className="h-10 w-10 animate-spin text-center text-blue-500" />{" "}
          loading...{" "}
        </div>
      </div>
    );

  const handleThumsUp = async () => {
    // 请求点赞api redis记录
    if (status === "unauthenticated") {
      toast.error("please login to upvote");
      return;
    }
    try {
      setLoading(true);
      const response = await fetch("/api/posts/like", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: params["post_id"],
          // 在这里添加其他需要的字段
        }),
      });
      const data = await response.json();
      if (data["status"] === 0) {
        toast.success(data["message"]);
      } else {
        toast.error(data["message"]);
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto flex   max-w-4xl flex-1 flex-col rounded-lg bg-white p-6 shadow-lg">
      <h1 className="mb-4 text-center text-3xl font-semibold">
        {gptsData?.show_name}
      </h1>

      <div className="mx-auto">
        <Button className="flex gap-2 font-semibold" onClick={handleThumsUp}>
          {loading && <Loader2Icon className="animate-spin" />}
          <span>Upvote</span>
          <span>🎉</span>
        </Button>
      </div>

      <Alert className="mx-auto my-3 max-w-xl">
        <Terminal className="h-4 w-4" />
        <AlertTitle>Heads up!</AlertTitle>
        <AlertDescription className="font-semibold">
          For those who directly collect GPTs URL to come in directly, due to
          our upgrading the data (400GPTs to 15000+) resulting in a change in
          routing, please go back to the homepage and search according to the
          title!
        </AlertDescription>
      </Alert>

      <h2 className="mb-3 text-xl font-semibold">Description</h2>

      <p className="mb-4 text-gray-700">{gptsData?.show_desc}</p>

      <h2 className="mb-3 text-xl font-semibold">Author</h2>
      {gptsData?.author ? (
        <p className="mb-4 font-semibold  text-teal-600">{gptsData?.author}</p>
      ) : (
        <p className="mb-4  font-semibold text-teal-600">To be added</p>
      )}

      {/* <h2 className="mb-3 text-xl font-semibold">Tags</h2>
      {gptsData.tag ? (
        <p className="mb-4 font-semibold  text-blue-600">{gptsData.tag}</p>
      ) : (
        <p className="mb-4  font-semibold text-blue-600">To be added</p>
      )} */}

      <h2 className="mb-3 text-xl font-bold">URL</h2>
      {gptsData?.short_url ? (
        <Link
          className=" mb-5 font-semibold text-teal-600 transition duration-150 hover:text-teal-700 hover:underline"
          href={`https://chat.openai.com/g/${gptsData.short_url}`}
          target="_blank"
        >
          Give a Try
        </Link>
      ) : (
        "-"
      )}

      {gptsData?.short_url && (
        <iframe
          title={gptsData.post_id}
          name={gptsData?.show_name}
          id={gptsData?.short_url}
          className="mb-5 h-[50vh] w-full border-2 border-teal-500"
          src={`https://chat.openai.com/g/${gptsData.short_url}`}
        ></iframe>
      )}

      <GiscusApp />
    </div>
  );
}
