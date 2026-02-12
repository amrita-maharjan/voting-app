"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import * as Dialog from "@radix-ui/react-dialog";
import Link from "next/link";

type Topic = {
  id: string;
  title: string;
};

export default function ExistingTopicsModal({ topics }: { topics: Topic[] }) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <Button className="ml-auto">Existing Topics</Button>
      </Dialog.Trigger>

      <Dialog.Overlay className="fixed inset-0 bg-black/50 z-40" />

      <Dialog.Content className="fixed top-1/2 left-1/2 z-50 w-[90%] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-lg bg-white p-6 shadow-lg">
        <Dialog.Title className="text-lg font-bold">Existing Topics</Dialog.Title>

        <div className="mt-4 max-h-64 overflow-y-auto space-y-2">
          {topics.length === 0 ? (
            <p className="text-sm text-gray-500">No topics available.</p>
          ) : (
            topics.map((topic) => (
              <Link
                key={topic.id}
                href={`/${topic.title}`}
                className="block p-2 border rounded hover:bg-gray-100 cursor-pointer"
                onClick={() => setOpen(false)}
              >
                {topic.title}
              </Link>
            ))
          )}
        </div>

        <div className="mt-4 flex justify-end">
          <Dialog.Close asChild>
            <Button variant="outline">Close</Button>
          </Dialog.Close>
        </div>
      </Dialog.Content>
    </Dialog.Root>
  );
}
