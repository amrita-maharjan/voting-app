"use client";

import React, { useState } from "react";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { useMutation } from "@tanstack/react-query";
import { createTopic } from "@/app/action";

const TopicCreator = () => {
  const [input, setInput] = useState<string>("");
  const { mutate, error, isPending } = useMutation({
    mutationFn: createTopic,
  });
  return (
    <div className="mt-12 flex flex-col gap-2">
      <div className="flex gap-2 ">
        <Input
          value={input}
          onChange={({ target }) => {
            setInput(target.value);
          }}
          placeholder="Enter topic here..."
          className="bg-white min-w-64"
        />
        <Button
          disabled={isPending}
          onClick={() => {
            mutate({ topicName: input });
          }}
        >
          Create
        </Button>
      </div>
      {error ? <p className="text-sm text-red-600">{error.message}</p> : null}
    </div>
  );
};

export default TopicCreator;
