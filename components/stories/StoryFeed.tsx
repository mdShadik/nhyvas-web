"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import { useQuery, useInfiniteQuery } from "@tanstack/react-query";
import { storiesService, groupStoryFeed, type StoryGroup } from "@/services/apiService/stories";
import { manageService } from "@/services/apiService/manage";
import { authApi } from "@/services/apiService/index";
import { StoryCircle } from "./StoryCircle";
import { StoryViewer } from "./StoryViewer";
import { MobileBottomSheet } from "@/components/ui/mobile-bottom-sheet";
import { useTranslation } from "react-i18next";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Plus, Eye, Image as ImageIcon } from "lucide-react";
import Image from "next/image";
import { noImagePlaceholder } from "@/assets";
import { ListPropertyButton } from "../common/ListPropertyButton";

export function StoryFeed() {
  const { t } = useTranslation();
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [initialGroupIndex, setInitialGroupIndex] = useState(0);
  const [ownerOptionsOpen, setOwnerOptionsOpen] = useState(false);
  const [propertySelectorOpen, setPropertySelectorOpen] = useState(false);
  const [selectedOwnerGroup, setSelectedOwnerGroup] = useState<StoryGroup | null>(null);

  // Get current user ID
  const { data: currentUserId } = useQuery({
    queryKey: ["auth", "me"],
    queryFn: authApi.getCurrentUserId,
    enabled: isAuthenticated,
  });

  // Get user location
  useEffect(() => {
    if (!("geolocation" in navigator)) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        });
      },
      () => {},
      { enableHighAccuracy: false, timeout: 10000 }
    );
  }, []);

  // Infinite query for stories
  const storiesQuery = useInfiniteQuery({
    queryKey: ["stories", "recommended", userLocation],
    queryFn: ({ pageParam = 0 }) =>
      storiesService.getRecommendedStories({
        userLat: userLocation?.latitude,
        userLng: userLocation?.longitude,
        userRadiusKm: 5,
        limit: 10,
        offset: pageParam,
      }),
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      if (lastPage.length < 10) return undefined;
      return allPages.flat().length;
    },
  });

  const allStories = useMemo(() => storiesQuery.data?.pages.flat() ?? [], [storiesQuery.data]);
  const storyGroups = useMemo(() => groupStoryFeed(allStories), [allStories]);

  const hasMyStory = useMemo(() => storyGroups.some(g => g.landlordId === currentUserId), [storyGroups, currentUserId]);

  // My Ads for property selector and visibility check
  const myAdsQuery = useQuery({
    queryKey: ["profile", "my-ads"],
    queryFn: () => manageService.getMyAds(),
    enabled: isAuthenticated,
  });

  const hasApprovedListings = useMemo(() => {
    return (myAdsQuery.data ?? []).some(ad => ad.status === "approved");
  }, [myAdsQuery.data]);

  // Observer for infinite scroll
  const loadMoreRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!loadMoreRef.current || !storiesQuery.hasNextPage || storiesQuery.isFetchingNextPage) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          storiesQuery.fetchNextPage();
        }
      },
      { threshold: 0.1, rootMargin: "0px 100px 0px 0px" } // Observe horizontal scroll
    );

    observer.observe(loadMoreRef.current);
    return () => observer.disconnect();
  }, [storiesQuery.hasNextPage, storiesQuery.isFetchingNextPage, storiesQuery.fetchNextPage]);

  const handleStoryClick = (group: StoryGroup, index: number) => {
    if (group.landlordId === currentUserId) {
      setSelectedOwnerGroup(group);
      setOwnerOptionsOpen(true);
    } else {
      setInitialGroupIndex(index);
      setViewerOpen(true);
    }
  };

  const handleAddStory = (propertyId: string) => {
    router.push(`/property?id=${propertyId}`);
    // The property page handles the actual story recording/uploading
  };

  if (storiesQuery.isLoading && !userLocation) {
    return (
      <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
        {[1, 2, 3, 4, 5].map((n) => (
          <div key={n} className="flex flex-col items-center gap-2 shrink-0">
            <div className="h-18 w-18 animate-pulse rounded-full bg-secondary-100 dark:bg-secondary-800" />
            <div className="h-3 w-12 animate-pulse rounded bg-secondary-100 dark:bg-secondary-800" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="relative mb-6">
      <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
        {storyGroups.map((group, idx) => (
          <StoryCircle
            key={group.landlordId}
            group={group}
            isOwner={group.landlordId === currentUserId}
            onClick={() => handleStoryClick(group, idx)}
          />
        ))}
        
        {/* If user is authenticated, has an approved listing, but hasn't posted a story, show an "Add Story" circle */}
        {isAuthenticated && hasApprovedListings && !hasMyStory && (
          <button
            onClick={() => setPropertySelectorOpen(true)}
            className="flex flex-col items-center gap-1.5 focus:outline-none transition-transform active:scale-95 shrink-0"
          >
            <div className="relative h-18 w-18 rounded-full border-2 border-dashed border-primary-500 p-0.5 flex items-center justify-center bg-primary-50/50 dark:bg-primary-900/10">
              <Plus className="h-8 w-8 text-primary-600" />
            </div>
            <span className="max-w-20 truncate text-[11px] font-medium text-text-primary">
              Add Story
            </span>
          </button>
        )}
        
        {/* Infinite scroll sentinel */}
        <div ref={loadMoreRef} className="w-1 shrink-0" />
        
        {storiesQuery.isFetchingNextPage && (
          <div className="flex items-center gap-2 shrink-0 pr-4">
            <div className="h-18 w-18 animate-pulse rounded-full bg-secondary-100 dark:bg-secondary-800" />
          </div>
        )}
      </div>

      {/* Story Viewer Overlay */}
      {viewerOpen && (
        <StoryViewer
          groups={storyGroups}
          initialGroupIndex={initialGroupIndex}
          onClose={() => setViewerOpen(false)}
        />
      )}

      {/* Owner Options Bottom Sheet */}
      <MobileBottomSheet
        open={ownerOptionsOpen}
        title="Your Story"
        onClose={() => setOwnerOptionsOpen(false)}
      >
        <div className="p-4 space-y-3">
          <button
            onClick={() => {
              setOwnerOptionsOpen(false);
              const idx = storyGroups.findIndex(g => g.landlordId === currentUserId);
              if (idx !== -1) {
                setInitialGroupIndex(idx);
                setViewerOpen(true);
              }
            }}
            className="flex w-full items-center gap-3 rounded-2xl bg-bg-card p-4 text-left transition hover:bg-secondary-100 dark:hover:bg-secondary-800 border border-border"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-100 text-primary-600 dark:bg-primary-900/40 dark:text-primary-300">
              <Eye className="h-5 w-5" />
            </div>
            <div>
              <div className="text-sm font-semibold text-text-primary">View Story</div>
              <div className="text-xs text-text-secondary">See how your story looks to others</div>
            </div>
          </button>

          <button
            onClick={() => {
              setOwnerOptionsOpen(false);
              setPropertySelectorOpen(true);
            }}
            className="flex w-full items-center gap-3 rounded-2xl bg-bg-card p-4 text-left transition hover:bg-secondary-100 dark:hover:bg-secondary-800 border border-border"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary-100 text-secondary-600 dark:bg-secondary-800 dark:text-secondary-300">
              <Plus className="h-5 w-5" />
            </div>
            <div>
              <div className="text-sm font-semibold text-text-primary">Add Story</div>
              <div className="text-xs text-text-secondary">Choose a property to add a story for</div>
            </div>
          </button>
        </div>
      </MobileBottomSheet>

      {/* Property Selector for Add Story */}
      <MobileBottomSheet
        open={propertySelectorOpen}
        title="Select Property"
        description="Choose a property to add a story (Max 5 stories per property)"
        onClose={() => setPropertySelectorOpen(false)}
      >
        <div className="p-4">
          {myAdsQuery.isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(n => (
                <div key={n} className="h-20 w-full animate-pulse rounded-2xl bg-secondary-100 dark:bg-secondary-800" />
              ))}
            </div>
          ) : myAdsQuery.data?.length === 0 ? (
            <div className="py-10 text-center">
              <ImageIcon className="mx-auto h-12 w-12 text-text-tertiary opacity-20" />
              <div className="mt-2 text-sm font-medium text-text-secondary">No properties found</div>
              <ListPropertyButton 
                className="mt-4 text-sm font-bold text-primary-600"
              >
                List a property first
              </ListPropertyButton>
            </div>
          ) : (
            <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
              {myAdsQuery.data?.map(property => (
                <button
                  key={property.id}
                  onClick={() => handleAddStory(property.id)}
                  className="flex w-full items-center gap-3 rounded-2xl border border-border bg-bg-card p-3 text-left transition hover:bg-secondary-100 dark:hover:bg-secondary-800"
                >
                  <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-secondary-100">
                    <Image
                      src={property.thumbnail_url || noImagePlaceholder}
                      alt=""
                      fill
                      unoptimized
                      className="object-cover"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-bold text-text-primary">{property.property_title}</div>
                    <div className="truncate text-xs text-text-tertiary">{property.location_text}</div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </MobileBottomSheet>
    </div>
  );
}
