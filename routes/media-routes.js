const express = require("express")
const multer = require("multer")
const { uploadMediaToCloudinary } = require("../helpers/cloudinary")


const upload = multer({dest: 'uploads/'})
const router = express.Router()

router.delete("/delete/:id", async (req, res) => {
    try {
      const { id } = req.params
      if (!id) {
        return res.status(400).json({
          success: false,
          message: "Assest id is required",
        });
      }
      await deleteMediaFromCloudinary(id)
      res.status(200).json({
        success: true,
        message: "Assest deleted successfully from cloudinary",
      });
    } catch (e) {
      console.log(e)
      res.status(500).json({ success: false, message: "Error deleting file" })
    }
  });
  
  router.post("/upload", upload.array("files", 10), async (req, res) => {
    try {
      const uploadPromises = req.files.map((file) =>
        uploadMediaToCloudinary(file.path)
      );
  
      const results = await Promise.all(uploadPromises)
      console.log(results)
      res.status(200).json({
        success: true,
        data: results,
      });
    } catch (event) {
      console.log(event)
      res
        .status(500)
        .json({ success: false, message: "Error in bulk uploading files" })
    }
  });
  
  module.exports = router;