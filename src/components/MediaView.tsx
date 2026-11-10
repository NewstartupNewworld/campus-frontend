import React, { useState } from 'react';
import { View, Image, TouchableOpacity } from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';
import ImageViewer from './ImageViewer';
import { isVideoUrl } from '../utils/media';
import { thumb } from '../utils/img';

function VideoBox({ uri, height }: { uri: string; height: number }) {
  const player = useVideoPlayer(uri, (p) => {
    p.loop = false;
  });
  return <VideoView player={player} style={{ width: '100%', height }} nativeControls contentFit="contain" />;
}

/** A photo (tap to open it full screen) or a video (with play controls). */
export default function MediaView({ uri, height = 200 }: { uri: string; height?: number }) {
  const [open, setOpen] = useState(false);

  if (isVideoUrl(uri)) {
    return (
      <View style={{ borderRadius: 14, overflow: 'hidden', backgroundColor: '#000' }}>
        <VideoBox uri={uri} height={height} />
      </View>
    );
  }
  return (
    <>
      <TouchableOpacity activeOpacity={0.9} onPress={() => setOpen(true)} accessibilityRole="imagebutton" accessibilityLabel="Open photo">
        <Image source={{ uri: thumb(uri, 800) }} style={{ width: '100%', height, borderRadius: 14 }} resizeMode="cover" />
      </TouchableOpacity>
      <ImageViewer uri={open ? uri : null} onClose={() => setOpen(false)} />
    </>
  );
}