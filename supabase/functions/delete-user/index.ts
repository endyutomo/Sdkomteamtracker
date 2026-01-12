import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
    // Handle CORS preflight
    if (req.method === "OPTIONS") {
        return new Response(null, { headers: corsHeaders });
    }

    try {
        // Get auth header
        const authHeader = req.headers.get("Authorization");
        if (!authHeader) {
            return new Response(
                JSON.stringify({ error: "No authorization header" }),
                { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        // Create client with user token to verify caller
        const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
        const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
        const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

        const userClient = createClient(supabaseUrl, supabaseAnonKey, {
            global: { headers: { Authorization: authHeader } },
        });

        // Get current user
        const { data: { user: caller }, error: userError } = await userClient.auth.getUser();
        if (userError || !caller) {
            return new Response(
                JSON.stringify({ error: "Unauthorized" }),
                { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        // Check if caller is a manager
        const { data: callerProfile } = await userClient
            .from("profiles")
            .select("division")
            .eq("user_id", caller.id)
            .single();

        if (!callerProfile || callerProfile.division !== "manager") {
            return new Response(
                JSON.stringify({ error: "Only managers can delete users" }),
                { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        // Parse request body
        const { targetUserId } = await req.json();

        if (!targetUserId) {
            return new Response(
                JSON.stringify({ error: "Missing targetUserId" }),
                { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        // Prevent self-deletion
        if (targetUserId === caller.id) {
            return new Response(
                JSON.stringify({ error: "Cannot delete your own account" }),
                { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        // Use service role client to delete user
        const adminClient = createClient(supabaseUrl, supabaseServiceKey, {
            auth: { autoRefreshToken: false, persistSession: false },
        });

        // Check if target is a superadmin (cannot be deleted)
        const { data: targetRole } = await adminClient
            .from("user_roles")
            .select("role")
            .eq("user_id", targetUserId)
            .maybeSingle();

        if (targetRole?.role === "superadmin") {
            return new Response(
                JSON.stringify({ error: "Cannot delete superadmin accounts" }),
                { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        // Delete related data first (cascade delete should handle most, but let's be explicit)
        // Delete user roles
        await adminClient.from("user_roles").delete().eq("user_id", targetUserId);

        // Delete activities
        await adminClient.from("activities").delete().eq("user_id", targetUserId);

        // Delete sales records
        await adminClient.from("sales_records").delete().eq("user_id", targetUserId);

        // Delete sales targets
        await adminClient.from("sales_targets").delete().eq("user_id", targetUserId);

        // Delete messages
        await adminClient.from("messages").delete().eq("sender_id", targetUserId);

        // Delete notifications
        await adminClient.from("notifications").delete().eq("user_id", targetUserId);

        // Delete message reads
        await adminClient.from("message_reads").delete().eq("user_id", targetUserId);

        // Delete profile
        await adminClient.from("profiles").delete().eq("user_id", targetUserId);

        // Finally delete the auth user
        const { error: deleteError } = await adminClient.auth.admin.deleteUser(targetUserId);

        if (deleteError) {
            console.error("Error deleting user:", deleteError);
            return new Response(
                JSON.stringify({ error: deleteError.message }),
                { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        return new Response(
            JSON.stringify({ success: true, message: "User deleted successfully" }),
            { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    } catch (error) {
        console.error("Unexpected error:", error);
        return new Response(
            JSON.stringify({ error: "Internal server error" }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
});
