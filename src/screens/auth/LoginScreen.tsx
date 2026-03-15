import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, Alert } from "react-native";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { supabase } from "../../lib/supabase";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { AuthStackParamList } from "../../navigation/RootNavigator";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type LoginForm = z.infer<typeof loginSchema>;
type Props = NativeStackScreenProps<AuthStackParamList, "Login">;

export default function LoginScreen({ navigation }: Props) {
  const [loading, setLoading] = useState(false);
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginForm) => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    });

    if (error) Alert.alert("Login Failed", error.message);
    setLoading(false);
  };

  return (
    <View className="flex-1 justify-center px-6 bg-slate-50">
      <Text className="text-3xl font-bold text-slate-900 mb-2">
        StrokeAlert
      </Text>
      <Text className="text-base text-slate-500 mb-8">
        Secure Access Portal
      </Text>

      <View className="space-y-4">
        <View>
          <Controller
            control={control}
            name="email"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                className={`w-full p-4 bg-white border rounded-xl ${errors.email ? "border-red-500" : "border-slate-200"}`}
                placeholder="Hospital Email"
                autoCapitalize="none"
                keyboardType="email-address"
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
              />
            )}
          />
          {errors.email && (
            <Text className="text-red-500 text-sm mt-1">
              {errors.email.message}
            </Text>
          )}
        </View>

        <View>
          <Controller
            control={control}
            name="password"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                className={`w-full p-4 bg-white border rounded-xl ${errors.password ? "border-red-500" : "border-slate-200"}`}
                placeholder="Password"
                secureTextEntry
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
              />
            )}
          />
          {errors.password && (
            <Text className="text-red-500 text-sm mt-1">
              {errors.password.message}
            </Text>
          )}
        </View>

        <TouchableOpacity
          className="w-full bg-blue-600 p-4 rounded-xl items-center mt-4"
          onPress={handleSubmit(onSubmit)}
          disabled={loading}
        >
          <Text className="text-white font-bold text-lg">
            {loading ? "Authenticating..." : "Sign In"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => navigation.navigate("Register")}
          className="mt-4 items-center"
        >
          <Text className="text-blue-600 font-medium">
            New staff? Request registration.
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
