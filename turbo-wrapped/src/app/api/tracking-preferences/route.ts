import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { OPTIONS } from "../auth/[...nextauth]/route";
import prisma from "@/app/lib/prisma";

export async function GET() {
    const session = await getServerSession(OPTIONS);
    if (!session?.user?.email) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
        where: { email: session.user.email },
        select: { trackingEnabled: true }
    });

    return NextResponse.json({ trackingEnabled: user?.trackingEnabled ?? false });
}

export async function POST(request: Request) {
    const session = await getServerSession(OPTIONS);
    if (!session?.user?.email) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { enabled } = await request.json();

    const user = await prisma.user.update({
        where: { email: session.user.email },
        data: { trackingEnabled: enabled },
    });

    return NextResponse.json({ trackingEnabled: user.trackingEnabled });
}