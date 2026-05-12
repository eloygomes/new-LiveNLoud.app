import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import UserProfileAvatar from "./UserProfileAvatar";
import userProfPic from "../assets/userPerfil.jpg";
import {
  getProfileImageObjectURL,
  revokeObjectURLSafe,
} from "../Tools/Controllers";

vi.mock("../Tools/Controllers", () => ({
  getProfileImageObjectURL: vi.fn(),
  revokeObjectURLSafe: vi.fn(),
}));

describe("UserProfileAvatar", () => {
  it("renders the fetched profile image when available", async () => {
    getProfileImageObjectURL.mockResolvedValueOnce("blob:avatar-1");

    render(<UserProfileAvatar alt="Profile avatar" size={52} />);

    await waitFor(() => {
      expect(screen.getByAltText("Profile avatar")).toHaveAttribute(
        "src",
        "blob:avatar-1",
      );
    });

    expect(screen.getByAltText("Profile avatar")).toHaveStyle({
      width: "52px",
      height: "52px",
    });
  });

  it("falls back to the default image when the custom image fails", async () => {
    getProfileImageObjectURL.mockResolvedValueOnce(null);

    render(<UserProfileAvatar alt="Fallback avatar" />);

    const image = await screen.findByAltText("Fallback avatar");
    fireEvent.error(image);

    expect(image.getAttribute("src")).toContain(userProfPic);
  });

  it("revokes the current object URL when the component unmounts", async () => {
    getProfileImageObjectURL.mockResolvedValueOnce("blob:avatar-2");

    const { unmount } = render(<UserProfileAvatar />);

    await waitFor(() => {
      expect(getProfileImageObjectURL).toHaveBeenCalled();
    });

    unmount();

    expect(revokeObjectURLSafe).toHaveBeenCalledWith("blob:avatar-2");
  });
});
