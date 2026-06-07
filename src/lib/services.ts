// Service for Google OAuth login
import { eq } from "drizzle-orm";
import { db, users } from "@/db/index";

interface GoogleAuthData {
  username: string;
  email: string;
  image?: string;
}

export async function loginWithGoogle(data: GoogleAuthData) {
  try {
    const existingUser = await (db.query as any).users.findFirst({
      where: eq((users as any).email, data.email),
    });

    if (existingUser) {
      if (existingUser.loginType === "credential") {
        throw new Error(
          "This email is registered using email/password. Please login with your password."
        );
      }

      await db
        .update(users as any)
        .set({
          fullName: data.username,
          profilePhoto: data.image,
        })
        .where(eq((users as any).email, data.email));

      return {
        id: existingUser.id,
        email: existingUser.email,
        name: existingUser.fullName,
        role: existingUser.userType,
        loginMethod: existingUser.loginType,
        image: existingUser.profilePhoto || data.image,
      };
    }

    const newUsersArray = await db
      .insert(users as any)
      .values({
        email: data.email,
        fullName: data.username,
        profilePhoto: data.image,
        isVerified: true,
        userType: "member",
        loginType: "google",
      })
      .returning();

    const newUser = (newUsersArray as any)[0];

    return {
      id: newUser.id,
      email: newUser.email,
      name: newUser.fullName,
      role: newUser.userType,
      loginMethod: newUser.loginType,
      image: newUser.profilePhoto || data.image,
    };
  } catch (error) {
    console.error("Error in loginWithGoogle:", error);
    throw error;
  }
}

