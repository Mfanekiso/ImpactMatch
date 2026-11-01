import React from "react";
import { Image } from "react-native";

export function profileImageUrl(profile = {}) {
  return profile.profileImageUrl || profile.photoURL || profile.logoUrl || profile.avatarUrl || null;
}

export default function ProfileImage({ profile, uri, style, fallback }) {
  const sourceUri = uri || profileImageUrl(profile);
  return sourceUri ? <Image source={{ uri: sourceUri }} style={style} /> : fallback || null;
}
