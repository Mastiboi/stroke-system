import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
} from "react-native";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { supabase } from "../../lib/supabase";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { AuthStackParamList } from "../../navigation/RootNavigator";
import { Picker } from "@react-native-picker/picker";

const registerSchema = z.object({
  name: z.string().min(2, "Full name is required"),
  email: z.string().email("Invalid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters for security"),
  role: z.enum(["EMO", "CLINICIAN", "RADIOLOGIST"], {
    message: "Role selection is required", // <-- FIXED: Changed from required_error
  }),
});

type RegisterForm = z.infer<typeof registerSchema>;
type Props = NativeStackScreenProps<AuthStackParamList, "Register">;

export default function RegisterScreen({ navigation }: Props) {
  const [loading, setLoading] = useState(false);
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: { role: "EMO" },
  });

  const onSubmit = async (data: RegisterForm) => {
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          name: data.name,
          role: data.role,
        },
      },
    });

    if (error) {
      Alert.alert("Registration Failed", error.message);
    } else {
      Alert.alert("Success", "Check your email for confirmation.", [
        { text: "OK", onPress: () => navigation.navigate("Login") },
      ]);
    }
    setLoading(false);
  };

  return (
    <ScrollView contentContainerStyle={{ flexGrow: 1 }} className="bg-slate-50">
      <View className="flex-1 justify-center px-6 py-12">
        <Text className="text-3xl font-bold text-slate-900 mb-2">
          Staff Onboarding
        </Text>
        <Text className="text-base text-slate-500 mb-8">
          Register for StrokeAlert Access
        </Text>

        <View className="space-y-4">
          <View>
            <Controller
              control={control}
              name="name"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  className={`w-full p-4 bg-white border rounded-xl ${errors.name ? "border-red-500" : "border-slate-200"}`}
                  placeholder="Full Name (e.g., Dr. Jane Doe)"
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                />
              )}
            />
            {errors.name && (
              <Text className="text-red-500 text-sm mt-1">
                {errors.name.message}
              </Text>
            )}
          </View>

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
                  placeholder="Secure Password"
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

          <View
            className={`bg-white border rounded-xl overflow-hidden ${errors.role ? "border-red-500" : "border-slate-200"}`}
          >
            <Controller
              control={control}
              name="role"
              render={({ field: { onChange, value } }) => (
                <Picker selectedValue={value} onValueChange={onChange}>
                  <Picker.Item
                    label="Emergency Medical Officer (EMO)"
                    value="EMO"
                  />
                  <Picker.Item label="Stroke Clinician" value="CLINICIAN" />
                  <Picker.Item label="Radiologist" value="RADIOLOGIST" />
                </Picker>
              )}
            />
          </View>
          {errors.role && (
            <Text className="text-red-500 text-sm mt-1">
              {errors.role.message}
            </Text>
          )}

          <TouchableOpacity
            className="w-full bg-blue-600 p-4 rounded-xl items-center mt-4"
            onPress={handleSubmit(onSubmit)}
            disabled={loading}
          >
            <Text className="text-white font-bold text-lg">
              {loading ? "Processing..." : "Register Account"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => navigation.navigate("Login")}
            className="mt-4 items-center"
          >
            <Text className="text-slate-600 font-medium">
              Already registered? Go to Login.
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}
