import { useMemo } from 'react';
import { useMoodStore } from '../stores/moodStore';
import { useTreeholeStore } from '../stores/treeholeStore';
import { getStorageArray } from '../utils/storage';

const EMERGENCY_SESSIONS_KEY = 'emergency_sessions';
const TREEHOLE_POSTS_KEY = 'treehole_posts';
const TREEHOLE_REPLIES_KEY = 'treehole_replies';

interface EmergencySessionData {
  sessionId: string;
  createdAt: number;
  completedAt: number | null;
}

interface TreeholePost {
  id: string;
  createdAt: string;
}

interface TreeholeReply {
  id: string;
  createdAt: string;
}

interface UserStats {
  usageDays: number;
  moodCount: number;
  emergencyCount: number;
  treeholeCount: number;
}

export function useUserStats(): UserStats {
  const moodEntries = useMoodStore((state) => state.entries);
  const treeholePosts = useTreeholeStore((state) => state.posts);

  return useMemo(() => {
    const emergencySessions = getStorageArray<EmergencySessionData>(EMERGENCY_SESSIONS_KEY);
    const localPosts = getStorageArray<TreeholePost>(TREEHOLE_POSTS_KEY);
    const localReplies = getStorageArray<TreeholeReply>(TREEHOLE_REPLIES_KEY);

    const moodCount = moodEntries.length;

    const emergencyCount = emergencySessions.filter(
      (s) => s.completedAt !== null
    ).length;

    const postIds = new Set<string>();
    treeholePosts.forEach(p => postIds.add(p.id));
    localPosts.forEach(p => postIds.add(p.id));
    const postCount = postIds.size;
    const replyCount = localReplies.length;
    const treeholeCount = postCount + replyCount;

    let usageDays = 0;
    if (moodEntries.length > 0) {
      const sortedEntries = [...moodEntries].sort(
        (a, b) => a.createdAt.getTime() - b.createdAt.getTime()
      );
      const firstEntryDate = sortedEntries[0].createdAt;
      const now = new Date();
      const diffMs = now.getTime() - firstEntryDate.getTime();
      usageDays = Math.max(1, Math.ceil(diffMs / (24 * 60 * 60 * 1000)));
    }

    return {
      usageDays,
      moodCount,
      emergencyCount,
      treeholeCount,
    };
  }, [moodEntries, treeholePosts]);
}

export function getUsageDays(): number {
  const moodEntries = useMoodStore.getState().entries;
  if (moodEntries.length === 0) return 0;

  const sortedEntries = [...moodEntries].sort(
    (a, b) => a.createdAt.getTime() - b.createdAt.getTime()
  );
  const firstEntryDate = sortedEntries[0].createdAt;
  const now = new Date();
  const diffMs = now.getTime() - firstEntryDate.getTime();
  return Math.max(1, Math.ceil(diffMs / (24 * 60 * 60 * 1000)));
}

export function getMoodCount(): number {
  return useMoodStore.getState().entries.length;
}

export function getEmergencyCount(): number {
  const sessions = getStorageArray<EmergencySessionData>(EMERGENCY_SESSIONS_KEY);
  return sessions.filter((s) => s.completedAt !== null).length;
}

export function getTreeholeCount(): number {
  const posts = useTreeholeStore.getState().posts;
  const localPosts = getStorageArray<TreeholePost>(TREEHOLE_POSTS_KEY);
  const localReplies = getStorageArray<TreeholeReply>(TREEHOLE_REPLIES_KEY);
  const postIds = new Set<string>();
  posts.forEach(p => postIds.add(p.id));
  localPosts.forEach(p => postIds.add(p.id));
  return postIds.size + localReplies.length;
}

export function getAllStats(): UserStats {
  return {
    usageDays: getUsageDays(),
    moodCount: getMoodCount(),
    emergencyCount: getEmergencyCount(),
    treeholeCount: getTreeholeCount(),
  };
}