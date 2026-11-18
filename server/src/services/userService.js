import prisma from "../lib/prisma.js";

const publicUserSelect = {
  id: true,
  firstName: true,
  lastName: true,
  email: true,
  phone: true,
  role: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
};

export const updateProfileService = async (userId, data) => {
  const updatedUser = await prisma.user.update({
    where: {
      id: userId,
    },
    data: {
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      ...(data.phone !== undefined && {
        phone: data.phone || null,
      }),
    },
    select: publicUserSelect,
  });

  return updatedUser;
};
