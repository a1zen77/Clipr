"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createClip, type Clip } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface ClipFormProps {
  onClipCreated: (clip: Clip) => void;
}

interface FormErrors {
  url?: string;
  start_time?: string;
  end_time?: string;
}

function parseTimestamp(value: string): number | null {
  // Accept either raw seconds ("10") or MM:SS ("1:30") format
  const trimmed = value.trim();
  if (trimmed.includes(":")) {
    const parts = trimmed.split(":").map(Number);
    if (parts.length === 2 && !parts.some(isNaN)) {
      return parts[0] * 60 + parts[1];
    }
    return null;
  }
  const num = parseFloat(trimmed);
  return isNaN(num) ? null : num;
}

function validateForm(
  url: string,
  startRaw: string,
  endRaw: string
): FormErrors {
  const errors: FormErrors = {};

  if (!url.trim()) {
    errors.url = "URL is required";
  } else if (!url.includes("x.com") && !url.includes("twitter.com")) {
    errors.url = "Must be an X/Twitter URL";
  }

  const start = parseTimestamp(startRaw);
  const end = parseTimestamp(endRaw);

  if (start === null) {
    errors.start_time = "Enter seconds (e.g. 10) or MM:SS (e.g. 1:30)";
  }
  if (end === null) {
    errors.end_time = "Enter seconds (e.g. 30) or MM:SS (e.g. 2:00)";
  }
  if (start !== null && end !== null) {
    if (end <= start) {
      errors.end_time = "End time must be after start time";
    } else if (end - start > 300) {
      errors.end_time = "Clip cannot exceed 5 minutes";
    }
  }

  return errors;
}

export function ClipForm({ onClipCreated }: ClipFormProps) {
  const [url, setUrl] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [errors, setErrors] = useState<FormErrors>({});

  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: createClip,
    onSuccess: (clip) => {
      // Invalidate the clips list so history refreshes
      queryClient.invalidateQueries({ queryKey: ["clips"] });
      onClipCreated(clip);
      // Reset form
      setUrl("");
      setStartTime("");
      setEndTime("");
      setErrors({});
    },
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const formErrors = validateForm(url, startTime, endTime);
    if (Object.keys(formErrors).length > 0) {
      setErrors(formErrors);
      return;
    }

    setErrors({});
    mutation.mutate({
      url: url.trim(),
      start_time: parseTimestamp(startTime)!,
      end_time: parseTimestamp(endTime)!,
    });
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Create a Clip</CardTitle>
        <CardDescription>
          Paste an X/Twitter post URL and set your start and end timestamps.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-5">

          {/* URL */}
          <div className="space-y-1.5">
            <Label htmlFor="url">X / Twitter URL</Label>
            <Input
              id="url"
              type="url"
              placeholder="https://x.com/user/status/..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              disabled={mutation.isPending}
            />
            {errors.url && (
              <p className="text-sm text-red-500">{errors.url}</p>
            )}
          </div>

          {/* Timestamps */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="start_time">Start Time</Label>
              <Input
                id="start_time"
                placeholder="e.g. 10 or 1:30"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                disabled={mutation.isPending}
              />
              {errors.start_time && (
                <p className="text-sm text-red-500">{errors.start_time}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="end_time">End Time</Label>
              <Input
                id="end_time"
                placeholder="e.g. 40 or 2:00"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                disabled={mutation.isPending}
              />
              {errors.end_time && (
                <p className="text-sm text-red-500">{errors.end_time}</p>
              )}
            </div>
          </div>

          {/* API error */}
          {mutation.isError && (
            <div className="rounded-md bg-red-50 border border-red-200 px-4 py-3">
              <p className="text-sm text-red-700">
                {mutation.error?.message || "Something went wrong"}
              </p>
            </div>
          )}

          <Button
            type="submit"
            className="w-full"
            disabled={mutation.isPending}
          >
            {mutation.isPending ? "Submitting..." : "Create Clip"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
