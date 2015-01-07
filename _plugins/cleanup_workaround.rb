module Jekyll
  class Site
    def process
      self.reset
      self.read
      if !ENV['NOCLEAN']
        self.cleanup
      end
      self.generate
      self.render
      self.write
    end
  end
end
