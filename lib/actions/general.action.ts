"use server";

import { generateObject } from "ai";
import { google } from "@ai-sdk/google";

import { db } from "@/firebase/admin";
import { feedbackSchema } from "@/constants";

// Define types
interface CreateFeedbackParams {
  interviewId: string;
  userId: string;
  transcript: { role: string; content: string }[];
  feedbackId?: string;
}

interface GetFeedbackByInterviewIdParams {
  interviewId: string;
  userId: string;
}

interface GetLatestInterviewsParams {
  userId: string;
  limit?: number;
}

interface Feedback {
  id: string;
  interviewId: string;
  userId: string;
  totalScore: number;
  categoryScores: Record<string, number>;
  strengths: string[];
  areasForImprovement: string[];
  finalAssessment: string;
  createdAt: string;
}

interface Interview {
  id: string;
  userId: string;
  finalized: boolean;
  createdAt: string;
  [key: string]: any;
}

export async function createFeedback(params: CreateFeedbackParams) {
  const { interviewId, userId, transcript, feedbackId } = params;

  try {
    const formattedTranscript = transcript
      .map((sentence) => `- ${sentence.role}: ${sentence.content}\n`)
      .join("");

    const { object } = await generateObject({
      model: google("gemini-2.0-flash-001", {
        structuredOutputs: false,
      }),
      schema: feedbackSchema,
      prompt: `
        You are an AI interviewer analyzing a mock interview. Evaluate the candidate thoroughly.
        Transcript:
        ${formattedTranscript}

        Score the candidate (0-100) in these categories only:
        - Communication Skills
        - Technical Knowledge  
        - Problem-Solving
        - Cultural & Role Fit
        - Confidence & Clarity
      `,
      system: "You are a professional interviewer analyzing a mock interview",
    });

    const feedbackDoc = {
      interviewId,
      userId,
      totalScore: object.totalScore,
      categoryScores: object.categoryScores,
      strengths: object.strengths,
      areasForImprovement: object.areasForImprovement,
      finalAssessment: object.finalAssessment,
      createdAt: new Date().toISOString(),
    };

    const docRef = feedbackId 
      ? db.collection("feedback").doc(feedbackId)
      : db.collection("feedback").doc();

    await docRef.set(feedbackDoc);

    return { success: true, feedbackId: docRef.id };
  } catch (error) {
    console.error("Error creating feedback:", error);
    return { success: false };
  }
}

export async function getInterviewById(id: string): Promise<Interview | null> {
  try {
    const snapshot = await db.collection("interviews").doc(id).get();
    return snapshot.exists ? { id: snapshot.id, ...snapshot.data() } as Interview : null;
  } catch (error) {
    console.error("Error getting interview:", error);
    return null;
  }
}

export async function getFeedbackByInterviewId(
  params: GetFeedbackByInterviewIdParams
): Promise<Feedback | null> {
  const { interviewId, userId } = params;

  try {
    const snapshot = await db.collection("feedback")
      .where("interviewId", "==", interviewId)
      .where("userId", "==", userId)
      .limit(1)
      .get();

    return snapshot.empty 
      ? null 
      : { id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as Feedback;
  } catch (error) {
    console.error("Error getting feedback:", error);
    return null;
  }
}

export async function getLatestInterviews(
  params: GetLatestInterviewsParams
): Promise<Interview[]> {
  const { userId, limit = 20 } = params;

  try {
    // First get finalized interviews ordered by date
    const snapshot = await db.collection("interviews")
      .where("finalized", "==", true)
      .orderBy("createdAt", "desc")
      .limit(limit)
      .get();
    
    // Then filter out the current user's interviews
    return snapshot.docs
      .filter(doc => doc.data().userId !== userId)
      .map(doc => ({ id: doc.id, ...doc.data() } as Interview));
  } catch (error) {
    console.error("Error getting interviews:", error);
    return [];
  }
}

export async function getInterviewsByUserId(
  userId: string
): Promise<Interview[]> {
  try {
    const snapshot = await db.collection("interviews")
      .where("userId", "==", userId)
      .orderBy("createdAt", "desc")
      .get();

    return snapshot.docs.map(doc => ({ 
      id: doc.id, 
      ...doc.data() 
    } as Interview));
  } catch (error) {
    console.error("Error getting user interviews:", error);
    return [];
  }
}
