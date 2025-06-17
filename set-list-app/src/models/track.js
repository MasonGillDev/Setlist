import { Timestamp } from "firebase/firestore";

export class Track {
  constructor({
    title,
    artist,
    userId,
    bucketTime,
    score = 0,
    likes = 0,
    album = null,
    releaseDate = null,
    acrCloudData = null,
    identifiedAt = null,
    setlistId = null,
  }) {
    this.title = title;
    this.artist = artist;
    this.userId = userId;
    this.bucketTime = bucketTime || Timestamp.now();
    this.score = score;
    this.likes = likes;
    this.album = album;
    this.releaseDate = releaseDate;
    this.acrCloudData = acrCloudData;
    this.identifiedAt = identifiedAt || new Date().toISOString();
    this.setlistId = setlistId;
  }

  // Convert to plain object for Firestore
  toFirestore() {
    return {
      title: this.title,
      artist: this.artist,
      userId: this.userId,
      bucketTime: this.bucketTime,
      score: this.score,
      likes: this.likes,
      album: this.album,
      releaseDate: this.releaseDate,
      acrCloudData: this.acrCloudData,
      identifiedAt: this.identifiedAt,
      setlistId: this.setlistId,
    };
  }
  static fromFirestore(data) {
    return new Track({
      ...data,
      bucketTime:
        data.bucketTime instanceof Timestamp
          ? data.bucketTime
          : Timestamp.now(),
      identifiedAt:
        data.identifiedAt instanceof Timestamp
          ? data.identifiedAt
          : Timestamp.now(),
    });
  }

  // Create from ACRCloud match
  static fromACRCloudMatch(matchData, userId) {
    const music = matchData.metadata.music?.[0];
    if (!music) {
      throw new Error("No music data in match");
    }

    return new Track({
      title: music.title || "Unknown",
      artist: music.artists?.map((a) => a.name).join(", ") || "Unknown",
      album: music.album?.name || null,
      releaseDate: music.release_date || null,
      score: music.score || 0,
      userId: userId,
      acrCloudData: music,
    });
  }
}
