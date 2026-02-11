"use client";

import { useEffect, useState } from "react";
import { Wordcloud } from "@visx/wordcloud";
import { scaleLog } from "@visx/scale";
import { Text } from "@visx/text";

import { useMutation } from "@tanstack/react-query";
import { submitComment } from "../action";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import MaxWidthWrapper from "@/components/MaxWidthWrapper";
import { io } from "socket.io-client";

const socket = io("http://localhost:8080");

interface ClientPageProps {
  topicName: string;
  initialData: { text: string; value: number }[];
}

const COLORS = ["#143059", "#2F6B9A", "#82a6c2"];

const ClientPage = ({ topicName, initialData }: ClientPageProps) => {
  const [words, setWords] = useState(initialData);
  const [input, setInput] = useState<string>("");

  const values = words.map((w) => w.value);

  const min = Math.max(1, Math.min(...values));
  const max = Math.max(min + 1, Math.max(...values));

  useEffect(() => {
    socket.emit("join-room", `room:${topicName}`);

    const handler = (message: string) => {
      const data = JSON.parse(message) as {
        text: string;
        value: number;
      }[];

      setWords((prev) => {
        const updated = [...prev];

        data.forEach((newWord) => {
          const index = updated.findIndex((w) => w.text === newWord.text);

          if (index !== -1) {
            updated[index] = {
              ...updated[index],
              value: updated[index].value + newWord.value,
            };
          } else if (updated.length < 50) {
            updated.push(newWord);
          }
        });

        return updated;
      });
    };

    socket.on("room-update", handler);

    return () => {
      socket.off("room-update", handler);
    };
  }, [topicName]);

  const fontScale = scaleLog({
    domain: [min, max],
    range: [10, 100],
  });

  const { mutate, isPending } = useMutation({
    mutationFn: submitComment,
    onSuccess: () => {
      if (!input.trim()) return;

      setWords((prev) => {
        const existing = prev.find((w) => w.text === input);

        if (existing) {
          return prev.map((w) =>
            w.text === input ? { ...w, value: w.value + 1 } : w
          );
        }

        return [...prev, { text: input, value: 1 }];
      });

      setInput("");
    },
  });

  return (
    <div className="w-full flex flex-col items-center justify-center min-h-screen bg-grid-zinc-50 pb-20 ">
      <MaxWidthWrapper className="flex flex-col item-center gap-6 pt-20">
        <h1 className="text-4xl sm:text-5xl font-bold text-center tracking-tight text-balance">
          What people think about{" "}
          <span className="text-blue-600">{topicName}</span>
        </h1>
        <p className="text-sm text-center ">(updated in real time)</p>
        <div className=" flex items-center justify-center">
          <Wordcloud
            words={words}
            width={500}
            height={500}
            fontSize={(data) => fontScale(data.value)}
            font={"Impact"}
            padding={2}
            spiral={"archimedean"}
            rotate={0}
            random={() => 0.5}
          >
            {(cloudWords) =>
              cloudWords.map((w, i) => (
                <Text
                  key={w.text}
                  fill={COLORS[i % COLORS.length]}
                  textAnchor="middle"
                  transform={`translate(${w.x}, ${w.y})`}
                  fontSize={w.size}
                  fontFamily={w.font}
                >
                  {w.text}
                </Text>
              ))
            }
          </Wordcloud>
        </div>

        <Label className="font-semibold tracking-tight text-lg pb-2">
          Here&apos;s what i think about {topicName}
        </Label>
        <div className="mt-1 flex gap-2 item-center">
          <Input
            placeholder={`${topicName} is absolutely ...`}
            value={input}
            onChange={({ target }) => setInput(target.value)}
          ></Input>
          <Button
            disabled={isPending}
            onClick={() => mutate({ comment: input, topicName })}
          >
            Share
          </Button>
        </div>
      </MaxWidthWrapper>
    </div>
  );
};

export default ClientPage;
