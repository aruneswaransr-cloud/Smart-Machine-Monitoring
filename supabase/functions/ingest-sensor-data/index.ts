import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey, X-Machine-ID",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const body = await req.json();

    const machineId = body.machine_id;
    if (!machineId) {
      return new Response(
        JSON.stringify({ error: "machine_id is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const { data: machine, error: machineError } = await supabase
      .from("machines")
      .select("id, type, load_percentage")
      .eq("id", machineId)
      .maybeSingle();

    if (machineError || !machine) {
      return new Response(
        JSON.stringify({ error: "Machine not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const reading = {
      machine_id: machineId,
      load_percentage: body.load_percentage ?? 0,
      rpm: body.rpm ?? 0,
      vibration: body.vibration ?? 0,
      temperature: body.temperature ?? 0,
      humidity: body.humidity ?? 0,
      current_load: body.current_load ?? 0,
      power_consumption: body.power_consumption ?? 0,
      performance_rate: body.performance_rate ?? 0,
      is_demo: false,
      recorded_at: new Date().toISOString(),
    };

    const { error: insertError } = await supabase
      .from("realtime_readings")
      .insert(reading);

    if (insertError) {
      return new Response(
        JSON.stringify({ error: "Failed to store reading" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const { error: updateError } = await supabase
      .from("machines")
      .update({
        rpm: reading.rpm,
        vibration: reading.vibration,
        temperature: reading.temperature,
        humidity: reading.humidity,
        current_load: reading.current_load,
        power_consumption: reading.power_consumption,
        performance_rate: reading.performance_rate,
        load_percentage: reading.load_percentage,
        last_reading_at: reading.recorded_at,
        is_online: true,
        updated_at: new Date().toISOString(),
      })
      .eq("id", machineId);

    if (updateError) {
      return new Response(
        JSON.stringify({ error: "Failed to update machine status" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    return new Response(
      JSON.stringify({ success: true, machine_id: machineId, timestamp: reading.recorded_at }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
