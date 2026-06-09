import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createSystemNotification } from "@/actions/notificationActions";

// Vercel Cron Jobs will securely hit this endpoint
export async function GET(request: Request) {
  try {
    // 1. Security Check (Vercel sends a CRON_SECRET header to prevent unauthorized triggers)
    const authHeader = request.headers.get('authorization');
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const now = new Date();

    // 2. Find all recurring tasks where the nextRunAt time has arrived (or passed)
    const tasksToRun = await prisma.task.findMany({
      where: {
        isRecurring: true,
        nextRunAt: {
          lte: now,
        },
      },
      include: {
        assignees: true,
      }
    });

    if (tasksToRun.length === 0) {
      return NextResponse.json({ success: true, message: "No recurring tasks to process at this time." });
    }

    // 3. Process each task and trigger the notification engine
    for (const task of tasksToRun) {
      // Dispatch notifications (Push + Email + In-App) to all assignees
      for (const assignee of task.assignees) {
        await createSystemNotification({
          userId: assignee.id,
          title: "Recurring Task Reminder",
          message: `Scheduled Action Required: ${task.title}`,
          link: "/tasks",
        });
      }

      // 4. Calculate the NEXT run date based on our custom cron string format
      // Format: "Minute Hour DayOfMonth Month DayOfWeek"
      const parts = task.cronExpression?.split(" ") || [];
      let nextRun = new Date(now);
      
      if (parts.length === 5) {
        const [min, hr, dom, month, dow] = parts;
        nextRun.setHours(parseInt(hr), parseInt(min), 0, 0);

        if (dow === "1") {
          // Weekly (Add 7 days for next Monday)
          nextRun.setDate(nextRun.getDate() + 7);
        } else if (dom === "1") {
          // Monthly (Add 1 month for the 1st of next month)
          nextRun.setMonth(nextRun.getMonth() + 1);
        } else {
          // Daily (Add 1 day)
          nextRun.setDate(nextRun.getDate() + 1);
        }
      } else {
        // Fallback safety: default to +1 day if the cron string is missing/malformed
        nextRun.setDate(nextRun.getDate() + 1);
      }

      // Update the task in the database for the next cycle
      await prisma.task.update({
        where: { id: task.id },
        data: { nextRunAt: nextRun }
      });
    }

    return NextResponse.json({ 
      success: true, 
      processedCount: tasksToRun.length,
      message: "Recurring tasks processed and rescheduled successfully." 
    });

  } catch (error) {
    console.error("Cron Engine Error:", error);
    return NextResponse.json({ success: false, error: "Cron execution failed." }, { status: 500 });
  }
}