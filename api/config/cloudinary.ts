import { v2 as cloudinary, type UploadApiOptions } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import multer from 'multer';

// Configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_KEY,
  api_secret: process.env.CLOUDINARY_SECRET
});

const uploadOptions: UploadApiOptions = {
  folder: "YelpCampV2",
  // Cloudinary inspects the actual file content and rejects anything that is not a real JPEG/PNG
  allowed_formats: ["jpeg", "jpg", "png"]
};

const storage = new CloudinaryStorage({
  cloudinary,
  // Function form: the package's static option typings don't resolve against current cloudinary
  // types; the options are passed through to upload_stream unchanged.
  params: () => uploadOptions
});

export const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024, files: 6 },
  fileFilter: (req, file, cb) => {
    if (["image/jpeg", "image/png"].includes(file.mimetype)) return cb(null, true);
    cb(new multer.MulterError("LIMIT_UNEXPECTED_FILE", "Only JPEG and PNG images are allowed"));
  }
});
export { cloudinary };
