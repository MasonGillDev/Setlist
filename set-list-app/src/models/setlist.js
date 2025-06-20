import { Timestamp } from 'firebase/firestore';

export class Setlist {
  constructor({
    name,
    userId,
    venue = null,
    date = null,
    description = null,
    trackCount = 0,
    createdAt = null,
    updatedAt = null,
    timestamp = null, // Keep for backward compatibility
    // New fields for global sets
    coordinates = null, // { latitude: number, longitude: number }
    isActive = false,
    numberOfUsers = 1,
    isGlobal = false, // To distinguish between personal and global sets
  }) {
    this.name = name;
    this.userId = userId;
    this.venue = venue;
    this.date = date;
    this.description = description;
    this.trackCount = trackCount;
    this.createdAt = createdAt || Timestamp.now();
    this.updatedAt = updatedAt || Timestamp.now();
    this.timestamp = timestamp || this.createdAt; // For backward compatibility
    // New fields
    this.coordinates = coordinates;
    this.isActive = isActive;
    this.numberOfUsers = numberOfUsers;
    this.isGlobal = isGlobal;
  }

  // Convert to plain object for Firestore
  toFirestore() {
    return {
      name: this.name,
      userId: this.userId,
      venue: this.venue,
      date: this.date,
      description: this.description,
      trackCount: this.trackCount,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      // New fields
      coordinates: this.coordinates,
      isActive: this.isActive,
      numberOfUsers: this.numberOfUsers,
      isGlobal: this.isGlobal,
    };
  }

  // Create from Firestore document
  static fromFirestore(doc) {
    const data = doc.data();
    return new Setlist({
      ...data,
      id: doc.id,
    });
  }
}
