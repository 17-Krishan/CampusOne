"use client";

import { useMemo, useState } from "react";
import { Search, Users, UserPlus, UserCheck, Loader2, GraduationCap, Github, Linkedin, Globe } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { getInitials } from "@/lib/utils";
import { BRANCHES } from "@/lib/constants";
import type { UserWithProfile } from "@/types";

type NetworkUser = UserWithProfile & {
  isFollowing: boolean;
  followerCount: number;
  followingCount: number;
};

interface NetworkClientProps {
  initialUsers: NetworkUser[];
  myFollowerCount: number;
  myFollowingCount: number;
}

export function NetworkClient({ initialUsers, myFollowerCount, myFollowingCount }: NetworkClientProps) {
  const [users, setUsers] = useState<NetworkUser[]>(initialUsers);
  const [followerCount, setFollowerCount] = useState(myFollowerCount);
  const [followingCount, setFollowingCount] = useState(myFollowingCount);

  const [search, setSearch] = useState("");
  const [branch, setBranch] = useState("all");
  const [tab, setTab] = useState<"discover" | "following">("discover");
  const [loadingUserId, setLoadingUserId] = useState<string | null>(null);

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      if (tab === "following" && !u.isFollowing) return false;
      const matchesBranch = branch === "all" || u.profile?.branch === branch;
      const q = search.trim().toLowerCase();
      const matchesSearch =
        !q ||
        `${u.profile?.firstName ?? ""} ${u.profile?.lastName ?? ""}`.toLowerCase().includes(q) ||
        u.profile?.rollNumber?.toLowerCase().includes(q) ||
        u.profile?.skills.some((s) => s.toLowerCase().includes(q));
      return matchesBranch && matchesSearch;
    });
  }, [users, tab, branch, search]);

  async function handleFollow(target: NetworkUser) {
    setLoadingUserId(target.id);
    try {
      const res = await fetch("/api/users/follow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: target.id }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error ?? "Failed to follow user");
      }
      setUsers((prev) =>
        prev.map((u) =>
          u.id === target.id
            ? { ...u, isFollowing: true, followerCount: u.followerCount + 1 }
            : u
        )
      );
      setFollowingCount((c) => c + 1);
    } catch (e: any) {
      toast.error(e.message ?? "Something went wrong.");
    } finally {
      setLoadingUserId(null);
    }
  }

  async function handleUnfollow(target: NetworkUser) {
    setLoadingUserId(target.id);
    try {
      const res = await fetch("/api/users/follow", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: target.id }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error ?? "Failed to unfollow user");
      }
      setUsers((prev) =>
        prev.map((u) =>
          u.id === target.id
            ? { ...u, isFollowing: false, followerCount: Math.max(0, u.followerCount - 1) }
            : u
        )
      );
      setFollowingCount((c) => Math.max(0, c - 1));
    } catch (e: any) {
      toast.error(e.message ?? "Something went wrong.");
    } finally {
      setLoadingUserId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold tracking-tight">Network</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Discover and connect with students on campus.
          </p>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <div className="text-center">
            <p className="font-semibold">{followingCount}</p>
            <p className="text-xs text-muted-foreground">Following</p>
          </div>
          <div className="text-center">
            <p className="font-semibold">{followerCount}</p>
            <p className="text-xs text-muted-foreground">Followers</p>
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)} className="flex-1">
          <TabsList>
            <TabsTrigger value="discover">Discover</TabsTrigger>
            <TabsTrigger value="following">Following</TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Search by name, roll no, skill..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={branch} onValueChange={setBranch}>
          <SelectTrigger className="w-[220px]">
            <SelectValue placeholder="All branches" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All branches</SelectItem>
            {BRANCHES.map((b) => (
              <SelectItem key={b} value={b}>
                {b}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {filteredUsers.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Users className="w-12 h-12 text-muted-foreground mb-3" />
          <p className="font-medium">No students found</p>
          <p className="text-sm text-muted-foreground mt-1">
            {tab === "following" ? "You aren't following anyone yet." : "Try a different search or branch."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredUsers.map((u) => (
            <Card key={u.id}>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Avatar className="w-12 h-12">
                    <AvatarImage src={u.profile?.avatar ?? undefined} />
                    <AvatarFallback>
                      {getInitials(u.profile?.firstName ?? "?", u.profile?.lastName)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold truncate">
                      {u.profile?.firstName} {u.profile?.lastName}
                    </p>
                    {u.profile?.branch && (
                      <p className="flex items-center gap-1 text-xs text-muted-foreground truncate">
                        <GraduationCap className="w-3.5 h-3.5 shrink-0" />
                        {u.profile.branch}
                        {u.profile.semester ? ` · Sem ${u.profile.semester}` : ""}
                      </p>
                    )}
                  </div>
                </div>

                {u.profile?.bio && (
                  <p className="text-sm text-muted-foreground mt-3 line-clamp-2">{u.profile.bio}</p>
                )}

                {u.profile && u.profile.skills.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {u.profile.skills.slice(0, 3).map((skill) => (
                      <Badge key={skill} variant="secondary" className="text-[10px]">
                        {skill}
                      </Badge>
                    ))}
                    {u.profile.skills.length > 3 && (
                      <Badge variant="secondary" className="text-[10px]">
                        +{u.profile.skills.length - 3}
                      </Badge>
                    )}
                  </div>
                )}

                <div className="flex items-center gap-3 mt-3 text-xs text-muted-foreground">
                  <span>
                    <strong className="text-foreground">{u.followerCount}</strong> followers
                  </span>
                  <span>
                    <strong className="text-foreground">{u.followingCount}</strong> following
                  </span>
                </div>

                <div className="flex items-center justify-between mt-4">
                  <div className="flex items-center gap-2">
                    {u.profile?.githubUrl && (
                      <a href={u.profile.githubUrl} target="_blank" rel="noreferrer">
                        <Github className="w-4 h-4 text-muted-foreground hover:text-foreground" />
                      </a>
                    )}
                    {u.profile?.linkedinUrl && (
                      <a href={u.profile.linkedinUrl} target="_blank" rel="noreferrer">
                        <Linkedin className="w-4 h-4 text-muted-foreground hover:text-foreground" />
                      </a>
                    )}
                    {u.profile?.portfolioUrl && (
                      <a href={u.profile.portfolioUrl} target="_blank" rel="noreferrer">
                        <Globe className="w-4 h-4 text-muted-foreground hover:text-foreground" />
                      </a>
                    )}
                  </div>
                  <Button
                    size="sm"
                    variant={u.isFollowing ? "outline" : "default"}
                    onClick={() => (u.isFollowing ? handleUnfollow(u) : handleFollow(u))}
                    disabled={loadingUserId === u.id}
                    className="gap-1.5"
                  >
                    {loadingUserId === u.id ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : u.isFollowing ? (
                      <UserCheck className="w-3.5 h-3.5" />
                    ) : (
                      <UserPlus className="w-3.5 h-3.5" />
                    )}
                    {u.isFollowing ? "Following" : "Follow"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}